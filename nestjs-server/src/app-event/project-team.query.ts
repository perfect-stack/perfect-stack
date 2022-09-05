import { CustomQuery } from '../data/custom-query.service';
import { Logger } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { QueryRequest } from '../data/query.request';
import { QueryResponse } from '../data/query.response';

export class ProjectTeamQuery implements CustomQuery {
  private readonly logger = new Logger(ProjectTeamQuery.name);

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
        'ProjectMember.ProjectId',
        knex.raw(
          'concat("Person".given_name, \' \', "Person".family_name) as name',
        ),
        'Person.email_address',
        'ProjectRole.name as role',
        knex.raw('max("Authentication".auth_time) as last_sign_in'),
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
      // left outer join "Person" on "ProjectMember".member_id = "Person".id
      // left outer join "ProjectRole" on "ProjectMember".role_id = "ProjectRole".id
      // left outer join "Authentication" on "Authentication".email_address = "Person".email_address

      select = select
        .from('ProjectMember')
        .leftOuterJoin('Person', 'ProjectMember.member_id', 'Person.id')
        .leftOuterJoin('ProjectRole', 'ProjectMember.role_id', 'ProjectRole.id')
        .leftOuterJoin(
          'Authentication',
          'Authentication.email_address',
          'Person.email_address',
        );

      // "Project".id,
      // "Person".given_name,
      // "Person".family_name,
      // "Person".email_address,
      // "ProjectRole".name;
      select = select
        .where('ProjectMember.ProjectId', '=', projectId)
        .groupBy(
          'ProjectMember.id',
          'Person.given_name',
          'Person.family_name',
          'Person.email_address',
          'ProjectRole.name',
        );

      return select;
    };

    // specify the pagination properties
    let dataQuery = from(selectData()).offset(offset).limit(pageSize);
    this.knexService.logQuery(this.logger, ProjectTeamQuery.name, dataQuery);

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
    const totalCount =
      countResponse && countResponse.length > 0
        ? Number(countResponse[0].count)
        : 0;

    const response: QueryResponse<any> = {
      resultList: dataResults,
      totalCount: totalCount,
    };

    return response;
  }
}
