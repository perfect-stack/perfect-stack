import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataService } from './data/data.service';
import { MetaEntityService } from './meta/meta-entity/meta-entity.service';
import { MetaMenuService } from './meta/meta-menu/meta-menu.service';
import { CustomQueryService } from './data/custom-query.service';
import { QueryRequest } from './data/query.request';
import { QueryResponse } from './data/query.response';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaMenuService: MetaMenuService,
    protected readonly dataService: DataService,
    protected readonly customQueryService: CustomQueryService,
  ) {}

  get(): string {
    this.logger.log('Health check is ok.');
    return `Health check ok at: ${new Date().toISOString()}. The version is: ${
      this.metaMenuService.getVersion().serverRelease
    }`;
  }

  async onApplicationBootstrap(): Promise<any> {
    await this.metaEntityService.syncMetaModelWithDatabase(false);
    this.addEventSearchCriteriaQuery();
    return;
  }

  private addEventSearchCriteriaQuery() {
    const eventSearchCriteriaQuery = {
      findByCriteria: (
        queryRequest: QueryRequest,
      ): Promise<QueryResponse<any>> => {
        const response: QueryResponse<any> = {
          resultList: [],
          totalCount: 0,
        };

        return new Promise((resolve, reject) => {
          resolve(response);
        });
      },
    };

    this.customQueryService.addCustomQuery(
      'EventSearchByCriteria',
      eventSearchCriteriaQuery,
    );
  }
}
