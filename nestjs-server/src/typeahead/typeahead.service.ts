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

    const whereClause = {};
    whereClause[attribute.typeaheadSearch[0]] = {
      [Op.like]: request.searchText + '%',
    };

    const orderClause = [];
    if (attribute.typeaheadSearch[0]) {
      orderClause.push([attribute.typeaheadSearch[0], 'ASC']);
    }

    const model = this.ormService.sequelize.model(attribute.relationshipTarget);
    const rows = await model.findAll({
      where: whereClause,
      limit: 20,
      order: orderClause,
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
      displayText += row[nextDisplayAttribute];
      displayText += ' ';
    }
    return displayText;
  }
}
