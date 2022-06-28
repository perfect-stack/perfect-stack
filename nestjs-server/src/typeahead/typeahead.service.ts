import { Injectable } from '@nestjs/common';
import { TypeaheadRequest } from './dto/typeahead.request';
import { OrmService } from '../orm/orm.service';
import { Model, Op } from 'sequelize';
import { Item } from './dto/typeahead.response';
import { MetaAttribute } from '../domain/meta.entity';

@Injectable()
export class TypeaheadService {
  constructor(protected readonly ormService: OrmService) {}

  async search(request: TypeaheadRequest): Promise<Item[]> {
    console.log(`Typeahead request: ${JSON.stringify(request.metaAttribute)}`);
    // SELECT id, d1, d2 FROM metaEntity.tableName WHERE d1+d2 LIKE request.searchText + '%' LIMIT 50
    //const q = `SELECT id, given_name, family_name FROM "Person" as "Person" WHERE given_name LIKE '${request.searchText}%' ORDER BY given_name, family_name LIMIT 20`;

    const attribute = request.metaAttribute;
    if (!attribute.typeaheadSearch) {
      throw new Error(
        `No typeahead search fields defined for attribute ${attribute.name}`,
      );
    }

    const orClause = [];
    const orderClause = [];
    for (const nextSearchTerm of attribute.typeaheadSearch) {
      orClause.push({
        [nextSearchTerm]: {
          [Op.iLike]: this.ormService.wrapWithWildcards(request.searchText),
        },
      });

      orderClause.push([nextSearchTerm, 'ASC']);
    }

    const whereClause = {
      [Op.or]: orClause,
    };

    const model = this.ormService.sequelize.model(attribute.relationshipTarget);
    const rows = await model.findAll({
      where: whereClause,
      order: orderClause,
      limit: 20,
    });

    const results: Item[] = [];
    for (const nextModel of rows) {
      results.push({
        id: nextModel['id'],
        displayText: this.toDisplayText(nextModel, attribute),
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
