import { CustomQuery } from '../data/custom-query.service';
import { Logger } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { QueryRequest } from '../data/query.request';
import { QueryResponse } from '../data/query.response';
import { Pool } from 'pg';
import { SettingsService } from '../settings/settings.service';

export class ProjectTeamQuery implements CustomQuery {
  private readonly logger = new Logger(ProjectTeamQuery.name);

  constructor(
    protected readonly knexService: KnexService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly settingsService: SettingsService,
  ) {}

  async findByCriteria(
    queryRequest: QueryRequest,
  ): Promise<QueryResponse<any>> {
    const databaseSettings = await this.settingsService.getDatabaseSettings();

    const pool = new Pool({
      user: databaseSettings.databaseUser,
      host: databaseSettings.databaseHost,
      database: databaseSettings.databaseName,
      password: databaseSettings.databasePassword,
      port: databaseSettings.databasePort,
    });

    const pageNumber = queryRequest.pageNumber ? queryRequest.pageNumber : 1;
    const pageSize = queryRequest.pageSize ? queryRequest.pageSize : 50;
    const offset = (pageNumber - 1) * pageSize;

    const projectId = this.getProjectId(queryRequest);

    const selectDataSQL =
      'Select\n' +
      '    "Person".id,\n' +
      '    concat("Person".given_name, \' \', "Person".family_name) as name,\n' +
      '    "Person".email_address,\n' +
      '    "ProjectRole".name as role,\n' +
      '    "ProjectTeamStatus".name as team_status,\n' +
      '    max("Authentication".auth_time) as last_sign_in\n' +
      'FROM "ProjectMember"\n' +
      '    left outer join "Person" on "ProjectMember".member_id = "Person".id\n' +
      '    left outer join "ProjectRole" on "ProjectMember".role_id = "ProjectRole".id\n' +
      '    left outer join "ProjectTeamStatus" on "ProjectMember".team_status_id = "ProjectTeamStatus".id\n' +
      '    left outer join "Authentication" on "Authentication".email_address = "Person".email_address\n' +
      'WHERE\n' +
      '    "ProjectMember"."project_id" = $1\n' +
      'GROUP BY "ProjectMember"."project_id",\n' +
      '         "Person".id\n,' +
      '         "Person".given_name,\n' +
      '         "Person".family_name,\n' +
      '         "Person".email_address,\n' +
      '         "ProjectRole".name,\n' +
      '         "ProjectTeamStatus".name\n' +
      'ORDER BY "name" ASC\n' + // ignoring the query criteria on this for now
      'OFFSET $2\n' +
      'LIMIT $3;\n';

    const selectDataResponse = await pool.query(selectDataSQL, [
      projectId,
      offset,
      pageSize,
    ]);

    this.logger.log(
      `selectDataResponse: ${JSON.stringify(selectDataResponse.rows)}`,
    );

    const selectCountSQL =
      'Select count(*) as total_count FROM "ProjectMember" WHERE "ProjectMember"."project_id" = $1';

    const selectCountResponse = await pool.query(selectCountSQL, [projectId]);

    this.logger.log(
      `selectCountResponse: ${JSON.stringify(selectCountResponse.rows)}`,
    );

    await pool.end();
    const dataResults = selectDataResponse.rows;
    const totalCount = Number(selectCountResponse.rows[0].total_count);

    const response: QueryResponse<any> = {
      resultList: dataResults,
      totalCount: totalCount,
    };

    return response;
  }

  getProjectId(queryRequest: QueryRequest) {
    const projectIdCriteria = queryRequest.criteria.find(
      (s) => s.name === 'id',
    );

    if (!projectIdCriteria || !projectIdCriteria.value) {
      throw new Error(
        'No project "id" has been supplied unable to execute the query',
      );
    }

    return projectIdCriteria.value;
  }
}
