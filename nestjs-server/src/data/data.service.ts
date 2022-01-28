import { Injectable, Logger } from '@nestjs/common';
import { PageQueryResponse } from '../domain/response/page-query.response';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';
import { OrmService } from '../orm/orm.service';
import { QueryRequest } from './query.request';
import { QueryResponse } from './query.response';
import { ComparisonOperator } from '../domain/meta.entity';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { MikroORM } from '@mikro-orm/core';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    protected readonly ormService: OrmService,
    protected readonly orm: MikroORM,
    protected readonly metaEntityService: MetaEntityService,
  ) {}

  async findAll(
    entityName: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<PageQueryResponse<Entity>> {
    const model = this.metaEntityService.entitySchemaMap.get(entityName);

    let nameCriteria = 'NONE';
    this.logger.log(
      `findAll pageNumber = ${pageNumber}, nameCriteria = ${nameCriteria}`,
    );

    if (nameCriteria) {
      nameCriteria = nameCriteria + '%';
    } else {
      nameCriteria = '%';
    }

    if (!pageNumber) {
      pageNumber = 1;
    }

    if (!pageSize) {
      pageSize = 50;
    }

    const offset = (pageNumber - 1) * pageSize;

    // const { count, rows } = await model.findAndCountAll({
    //   order: ['given_name'],
    //   offset: offset,
    //   limit: pageSize,
    // });
    //
    // const resultList = rows as unknown as Entity[];
    // return {
    //   resultList: resultList,
    //   totalCount: count,
    // };

    return {
      resultList: [],
      totalCount: 0,
    };
  }

  async findOne(entityName: string, id: string): Promise<Entity> {
    //const model = this.ormService.sequelize.model(entityName);
    //return (await model.findByPk(id)) as unknown as Entity;
    return this.orm.em
      .getRepository(entityName)
      .findOne(id) as unknown as Entity;
  }

  async create(entityName: string, entity: Entity): Promise<EntityResponse> {
    // const model = this.ormService.sequelize.model(entityName);
    // return model.create(entity);
    await this.orm.em.getRepository(entityName).persistAndFlush(entity);
    return null;
  }

  async update(entityName: string, entity: Entity): Promise<EntityResponse> {
    this.logger.log(`UPDATE.1: ${entityName}: ${JSON.stringify(entity)}`);
    // const model = this.ormService.sequelize.model(entityName);
    // const entityFromDb = await model.findByPk(entity.id);
    // entityFromDb.set(entity);
    //
    // this.logger.log(`UPDATE.2: ${entityName}: ${JSON.stringify(entityFromDb)}`);
    // return entityFromDb.save();
    return null;
  }

  archive(entityName: string, id: string): Promise<void> {
    return;
  }

  purge(): Promise<void> {
    return;
  }

  async findByCriteria(queryRequest: QueryRequest) {
    console.log(`findByCriteria(): ${JSON.stringify(queryRequest)}`);

    // const model = this.ormService.sequelize.model(queryRequest.metaEntityName);
    // let pageNumber = queryRequest.pageNumber;
    // let pageSize = queryRequest.pageSize;
    //
    // if (!pageNumber) {
    //   pageNumber = 1;
    // }
    //
    // if (!pageSize) {
    //   pageSize = 50;
    // }
    //
    // const criteria = {};
    //
    // const operatorMap = new Map<string, symbol>();
    // operatorMap.set(ComparisonOperator.Equals, Op.eq);
    // operatorMap.set(ComparisonOperator.StartsWith, Op.startsWith);
    //
    // for (const nextCriteria of queryRequest.criteria) {
    //   if (nextCriteria.value) {
    //     const op = operatorMap.get(nextCriteria.operator);
    //     if (op) {
    //       criteria[nextCriteria.name] = {
    //         [op]: nextCriteria.value,
    //       };
    //     } else {
    //       throw new Error(
    //         `Unknown operator for criteria ${nextCriteria.operator}`,
    //       );
    //     }
    //   }
    // }
    //
    // const orderBy = [];
    // if (queryRequest.orderByName && queryRequest.orderByDir) {
    //   orderBy.push([queryRequest.orderByName, queryRequest.orderByDir]);
    // }
    //
    // const offset = (pageNumber - 1) * pageSize;
    // const { count, rows } = await model.findAndCountAll({
    //   where: criteria,
    //   order: orderBy,
    //   offset: offset,
    //   limit: pageSize,
    // });

    // const response = new QueryResponse<Entity>();
    // response.resultList = rows as unknown as Entity[];
    // response.totalCount = count;

    const response = new QueryResponse<Entity>();
    response.resultList = [];
    response.totalCount = 0;

    return response;
  }
}
