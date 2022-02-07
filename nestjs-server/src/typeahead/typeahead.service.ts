import { Injectable } from '@nestjs/common';
import { TypeaheadRequest } from './dto/typeahead.request';
import { OrmService } from '../orm/orm.service';
import { QueryTypes } from 'sequelize';
import { Item } from './dto/typeahead.response';

@Injectable()
export class TypeaheadService {
  constructor(protected readonly ormService: OrmService) {}

  async search(request: TypeaheadRequest): Promise<Item[]> {
    // SELECT id, d1, d2 FROM metaEntity.tableName WHERE d1+d2 LIKE request.searchText + '%' LIMIT 50
    const q = `SELECT id, given_name, family_name FROM "Person" as "Person" WHERE given_name LIKE '${request.searchText}%' ORDER BY given_name, family_name LIMIT 20`;

    const rows = await this.ormService.sequelize.query(q, {
      type: QueryTypes.SELECT,
    });

    const results: Item[] = [];
    for (const nextRow of rows) {
      results.push({
        id: nextRow['id'],
        displayText: `${nextRow['given_name']} ${nextRow['family_name']}`,
      });
    }

    return results;
  }
}
