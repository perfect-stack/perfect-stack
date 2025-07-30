import { KnexService } from '../knex/knex.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { CustomQuery } from '../data/custom-query.service';
import { QueryRequest } from '../data/query.request';
import { QueryResponse } from '../data/query.response';
import { Logger } from '@nestjs/common';
import {getCriteriaValue, KnexComparisonOperatorMap} from "../data/query-utils";

export class BirdQuery implements CustomQuery {
  private readonly logger = new Logger(BirdQuery.name);

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
        'Bird.id',
        'Bird.name',
        'Bird.band_number',
        'Bird.colour_band',
        'Species.id as species_id',
        'Species.name as species',
        'Bird.form as bird_form',
        'Bird.transmitter_channel',
        'Bird.transmitter_frequency',
        'Bird.microchip',
        'Bird.wing_tag',
        'Bird.status as status',
        'Bird.sex'
      );

    const selectCount = () => knex.select().count();
    const comparisonOperatorMap = KnexComparisonOperatorMap();

    let from = (select) => {
      select = select
        .from('Bird')
        .leftOuterJoin('Species', 'Species.id', 'Bird.species_id');

      for (const criteria of queryRequest.criteria) {
        let name = criteria.name === 'name' ? 'Bird.name' : criteria.name;
        name = criteria.name === 'form' ? 'Bird.form' : criteria.name;
        const operator = comparisonOperatorMap.get(criteria.operator);
        const value: any = getCriteriaValue(criteria);

        select = select.where(name, operator, value);
      }

      return select;
    };


    // specify the pagination properties
    let dataQuery = from(selectData()).offset(offset).limit(pageSize);
    this.knexService.logQuery(this.logger, BirdQuery.name, dataQuery);

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
