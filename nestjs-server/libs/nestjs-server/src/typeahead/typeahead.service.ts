import { Injectable, Logger } from '@nestjs/common';
import { TypeaheadRequest } from './dto/typeahead.request';
import { OrmService } from '../orm/orm.service';
import { Model, Op } from 'sequelize';
import { Item } from './dto/typeahead.response';
import { MetaAttribute } from '../domain/meta.entity';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { wrapWithWildcards } from '../data/query-utils';

@Injectable()
export class TypeaheadService {
  private readonly logger = new Logger(TypeaheadService.name);

  constructor(
    protected readonly ormService: OrmService,
    protected readonly metaEntityService: MetaEntityService,
  ) {}

  async search(request: TypeaheadRequest): Promise<Item[]> {
    this.logger.log(
      `Typeahead request: ${JSON.stringify(request.metaAttribute)}`,
    );

    if (!request.metaAttribute.typeaheadSearch) {
      throw new Error(
        `No typeahead search fields defined for attribute ${request.metaAttribute.name}`,
      );
    }

    // A high level check was already done at the API level but our current Subject name capability doesn't have
    // the ability to read the right subject name out of incoming request payloads so since we know what the right
    // subject/entity name is now we can do a proper check now.
    //const subjectName = request.metaEntityName;
    //this.authorizationService.checkPermissionWithMap();

    // we should not trust the data in the TypeaheadRequest as part of the sequelize.literal() statement below, so use
    // the data from the TypeaheadRequest as parameters to look up the MetaAttribute from our own internal store and
    // use that instead of what we have been sent.
    const metaEntity = await this.metaEntityService.findOne(request.metaEntityName);
    const metaAttribute = metaEntity.attributes.find(
      (x) => x.name === request.metaAttribute.name,
    );

    const tableName = metaAttribute.relationshipTarget;

    const whereClause = {};
    if (request.searchId) {
      whereClause['id'] = {
        [Op.eq]: request.searchId,
      };
    }
    else if (request.searchIdList) {
      whereClause['id'] = {
        [Op.in]: request.searchIdList,
      };
    }
    else if (request.searchText) {
      const searchFieldList = metaAttribute.typeaheadSearch.join(", ' ', ");
      const searchValue = wrapWithWildcards(request.searchText);
      whereClause['id'] = {
        [Op.in]: this.ormService.sequelize.literal(
          `(Select id from "${tableName}" where concat(${searchFieldList}) ilike '${searchValue}')`,
        ),
      };
    }
    else {
      throw new Error(
        'Invalid TypeaheadRequest searchId XOR searchText must be supplied',
      );
    }

    const orderClause = [];
    for (const nextSearchTerm of metaAttribute.typeaheadSearch) {
      orderClause.push([nextSearchTerm, 'ASC']);
    }

    const model = this.ormService.sequelize.model(
      metaAttribute.relationshipTarget,
    );

    const rows = await model.findAll({
      where: whereClause,
      order: orderClause,
      limit: 20,
    });

    const results: Item[] = [];
    for (const nextModel of rows) {
      results.push({
        id: nextModel['id'],
        displayText: this.toDisplayText(nextModel, metaAttribute),
      });
    }

    return results;
  }

  toDisplayText(row: Model<any, any>, metaAttribute: MetaAttribute) {
    let displayText = '';
    for (const nextDisplayAttribute of metaAttribute.typeaheadSearch) {
      if (row[nextDisplayAttribute]) {
        displayText += row[nextDisplayAttribute];
        displayText += ' ';
      }
    }
    return displayText.trim();
  }
}
