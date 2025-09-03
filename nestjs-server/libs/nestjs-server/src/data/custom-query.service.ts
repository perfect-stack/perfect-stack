import { Injectable, Logger } from '@nestjs/common';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { OrmService } from '../orm/orm.service';
import { QueryRequest } from './query.request';
import { QueryResponse } from './query.response';

@Injectable()
export class CustomQueryService {
  private readonly logger = new Logger(CustomQueryService.name);

  private queryMap = new Map<string, CustomQuery>();

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly ormService: OrmService,
  ) {}

  addCustomQuery(name: string, customQuery: CustomQuery) {
    if (this.queryMap.has(name)) {
      throw new Error(
        `A customQuery is already defined for ${name}. Check your query name to avoid overwriting existing queries`,
      );
    }
    this.queryMap.set(name, customQuery);
  }

  async findByCriteria(
    queryRequest: QueryRequest,
  ): Promise<QueryResponse<any>> {
    this.logger.log(`Execute customQuery: ${queryRequest.customQuery}`);
    const query = this.queryMap.get(queryRequest.customQuery);
    if (query) {
      return query.findByCriteria(queryRequest);
    } else {
      throw new Error(
        `Unable to find customQuery for "${queryRequest.customQuery}". Has one been added using the addCustomQuery() method?`,
      );
    }
  }
}

export interface CustomQuery {
  findByCriteria(queryRequest: QueryRequest): Promise<QueryResponse<any>>;
}
