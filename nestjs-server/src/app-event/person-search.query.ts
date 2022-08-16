import { CustomQuery } from '../data/custom-query.service';
import { QueryResponse } from '../data/query.response';
import { QueryRequest } from '../data/query.request';
import { KnexService } from '../knex/knex.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import {
  getCriteriaValue,
  KnexComparisonOperatorMap,
  wrapWithWildcards,
} from '../data/query-utils';

export class PersonSearchQuery implements CustomQuery {
  constructor(
    protected readonly knexService: KnexService,
    protected readonly metaEntityService: MetaEntityService,
  ) {}

  async findByCriteria(
    queryRequest: QueryRequest,
  ): Promise<QueryResponse<any>> {
    let pageNumber = queryRequest.pageNumber;
    let pageSize = queryRequest.pageSize;

    if (!pageNumber) {
      pageNumber = 1;
    }

    if (!pageSize) {
      pageSize = 50;
    }
    const offset = (pageNumber - 1) * pageSize;

    //const metaEntity = await this.metaEntityService.findOne('Person');

    const knex = await this.knexService.getKnex();
    const selectData = () =>
      knex.select(
        'Person.id as id',
        knex.raw(
          'concat("Person".given_name, \' \', "Person".family_name) as name',
        ),
        'Person.email_address',
        'Organisation.id as organisation_ic',
        'Organisation.name as organisation',
      );

    const selectCount = () => knex.select().count();

    const from = (select) => {
      select = select
        .from('Person')
        .leftOuterJoin(
          'Organisation',
          'Organisation.id',
          'Person.organisation_id',
        );

      const comparisonOperatorMap = KnexComparisonOperatorMap();

      for (const criteria of queryRequest.criteria) {
        const name = criteria.name;
        const operator = comparisonOperatorMap.get(criteria.operator);
        const value: any = getCriteriaValue(criteria);

        if (name === 'organisation_id') {
          // TODO: add organisation criteria
        } else if (name === 'name') {
          select = select
            .where('Person.given_name', 'ilike', wrapWithWildcards(value))
            .orWhere('Person.family_name', 'ilike', wrapWithWildcards(value));
        } else {
          select = select.where(name, operator, value);
        }
      }

      return select;
    };

    // specify the pagination properties
    let dataQuery = from(selectData()).offset(offset).limit(pageSize);

    console.log(`dataQuery: ${JSON.stringify(dataQuery.toSQL().toNative())}`);

    // specify the ordering properties
    if (queryRequest.orderByName && queryRequest.orderByDir) {
      const orderBy = [];
      orderBy.push({
        column: queryRequest.orderByName,
        order: queryRequest.orderByDir,
        nulls: 'last',
      });
      dataQuery = dataQuery.orderBy(orderBy);
    }

    const dataResults = await dataQuery;

    const countResponse = await from(selectCount());
    const totalCount = Number(countResponse[0].count);

    const response: QueryResponse<any> = {
      resultList: dataResults,
      totalCount: totalCount,
    };

    return response;
  }
}
