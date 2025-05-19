import { KnexService } from '../knex/knex.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { CustomQuery } from '../data/custom-query.service';
import { QueryRequest } from '../data/query.request';
import { QueryResponse } from '../data/query.response';
import { Logger } from '@nestjs/common';

export class ProjectBirdsQuery implements CustomQuery {
  private readonly logger = new Logger(ProjectBirdsQuery.name);

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
        'Species.id as species_id',
        'Species.name as species',
        'Bird.form',
        'Bird.band',
        'Bird.microchip',
        'Bird.wing_tag',
        'Bird.status',
        'Bird.sex',
        'ProjectBird.project_id',
      );

    const selectCount = () => knex.select().count();

    const projectIdCriteria = queryRequest.criteria.find(
      (s) => s.name === 'id',
    );
    if (!projectIdCriteria || !projectIdCriteria.value) {
      throw new Error(
        'No project "id" has been supplied unable to execute the query',
      );
    }

    const projectId = projectIdCriteria.value;
    const from = (select) => {
      select = select
        .from('Bird')
        .leftOuterJoin('ProjectBird', 'ProjectBird.bird_id', 'Bird.id')
        .leftOuterJoin('Species', 'Species.id', 'Bird.species_id');

      select = select.where('ProjectBird.project_id', '=', projectId);

      return select;
    };

    // specify the pagination properties
    let dataQuery = from(selectData()).offset(offset).limit(pageSize);
    this.knexService.logQuery(this.logger, ProjectBirdsQuery.name, dataQuery);

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
