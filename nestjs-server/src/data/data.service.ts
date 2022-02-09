import { Injectable, Logger } from '@nestjs/common';
import { PageQueryResponse } from '../domain/response/page-query.response';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';
import { OrmService } from '../orm/orm.service';
import { QueryRequest } from './query.request';
import { QueryResponse } from './query.response';
import { Op } from 'sequelize';
import {
  AttributeType,
  ComparisonOperator,
  MetaAttribute,
  MetaEntity,
} from '../domain/meta.entity';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import * as uuid from 'uuid';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly ormService: OrmService,
  ) {}

  async findAll(
    entityName: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<PageQueryResponse<Entity>> {
    const model = this.ormService.sequelize.model(entityName);

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

    const { count, rows } = await model.findAndCountAll({
      order: ['given_name'],
      offset: offset,
      limit: pageSize,
    });

    const resultList = rows as unknown as Entity[];
    return {
      resultList: resultList,
      totalCount: count,
    };
  }

  async findOne(entityName: string, id: string): Promise<Entity> {
    const model = this.ormService.sequelize.model(entityName);
    return (await model.findByPk(id, {
      include: { all: true, nested: true },
    })) as unknown as Entity;
  }

  validateUuid(value: string) {
    try {
      uuid.parse(value);
    } catch (error) {
      throw new Error(`Invalid UUID of ${value}`);
    }
  }

  async save(entityName: string, entity: Entity): Promise<EntityResponse> {
    const model = this.ormService.sequelize.model(entityName);

    // entity may arrive with or without an id, and may exist or not exist in the database
    let entityModel;
    if (entity.id) {
      this.validateUuid(entity.id);
      entityModel = await model.findByPk(entity.id);
    } else {
      entity.id = uuid.v4();
    }

    // recursively save all the children
    await this.saveTheChildren(entityName, entity);

    if (!entityModel) {
      // if entityModel was not found, or entity did not arrive with id
      entityModel = await model.create(entity);
    } else {
      // else entityModel was found
      entityModel.set(entity);
      await entityModel.save();
    }

    return entityModel;
  }

  private async saveTheChildren(
    parentEntityName: string,
    parentEntity: Entity,
  ) {
    const parentMetaEntity = await this.metaEntityService.findOne(
      parentEntityName,
    );

    if (parentMetaEntity) {
      for (const attribute of parentMetaEntity.attributes) {
        switch (attribute.type) {
          case AttributeType.OneToMany:
            await this.saveListOfChildren(
              parentEntity,
              parentMetaEntity,
              attribute,
            );
            break;
          case AttributeType.OneToOne:
            await this.saveOneChild(parentEntity, attribute);
            break;
          case AttributeType.ManyToOne:
            await this.saveManyToOne(parentEntity, attribute);
            break;
          default:
          // Do nothing
        }
      }
    } else {
      throw new Error(`Unable to find MetaEntity ${parentEntityName}`);
    }
  }

  private async saveListOfChildren(
    parentEntity: Entity,
    parentMetaEntity: MetaEntity,
    relationshipAttribute: MetaAttribute,
  ) {
    let childEntityModel;
    const childModel = await this.ormService.sequelize.model(
      relationshipAttribute.relationshipTarget,
    );

    const childList = parentEntity[relationshipAttribute.name] as [];
    if (childList) {
      for (const nextChild of childList) {
        const childEntity = nextChild as Entity;

        if (childEntity.id) {
          this.validateUuid(childEntity.id);
          childEntityModel = await childModel.findByPk(childEntity.id);
        } else {
          childEntity.id = uuid.v4();
        }

        if (!childEntityModel) {
          childEntityModel = await childModel.create(childEntity);
        }

        await this.saveTheChildren(
          relationshipAttribute.relationshipTarget,
          childEntity,
        );

        childEntityModel.set(childEntity);
        childEntityModel[parentMetaEntity.name + 'Id'] = parentEntity.id;
        childEntityModel.save();
      }
    }
  }

  private async saveOneChild(
    parentEntity: Entity,
    relationshipAttribute: MetaAttribute,
  ) {
    const childEntity = parentEntity[relationshipAttribute.name] as Entity;
    if (!childEntity) {
      return;
    }

    let childEntityModel;
    const childModel = await this.ormService.sequelize.model(
      relationshipAttribute.relationshipTarget,
    );

    if (childEntity.id) {
      this.validateUuid(childEntity.id);
      childEntityModel = await childModel.findByPk(childEntity.id);
    } else {
      childEntity.id = uuid.v4();
    }

    if (!childEntityModel) {
      childEntityModel = await childModel.create(childEntity);
    }

    // recurse down into the children of this child (if needed)
    await this.saveTheChildren(
      relationshipAttribute.relationshipTarget,
      childEntity,
    );

    childEntityModel.set(childEntity);
    childEntityModel.save();
    parentEntity[relationshipAttribute.name + '_id'] = childEntity.id;
  }

  private async saveManyToOne(
    parentEntity: Entity,
    relationshipAttribute: MetaAttribute,
  ) {
    const childEntity = parentEntity[relationshipAttribute.name] as Entity;
    if (!childEntity) {
      return;
    }

    parentEntity[relationshipAttribute.name + '_id'] = childEntity.id;
  }

  archive(entityName: string, id: string): Promise<void> {
    return;
  }

  purge(): Promise<void> {
    return;
  }

  async findByCriteria(queryRequest: QueryRequest) {
    console.log(`findByCriteria(): ${JSON.stringify(queryRequest)}`);

    const model = this.ormService.sequelize.model(queryRequest.metaEntityName);
    let pageNumber = queryRequest.pageNumber;
    let pageSize = queryRequest.pageSize;

    if (!pageNumber) {
      pageNumber = 1;
    }

    if (!pageSize) {
      pageSize = 50;
    }

    const criteria = {};

    const operatorMap = new Map<string, symbol>();
    operatorMap.set(ComparisonOperator.Equals, Op.eq);
    operatorMap.set(ComparisonOperator.StartsWith, Op.startsWith);

    for (const nextCriteria of queryRequest.criteria) {
      if (nextCriteria.value) {
        const op = operatorMap.get(nextCriteria.operator);
        if (op) {
          criteria[nextCriteria.name] = {
            [op]: nextCriteria.value,
          };
        } else {
          throw new Error(
            `Unknown operator for criteria ${nextCriteria.operator}`,
          );
        }
      }
    }

    const orderBy = [];
    if (queryRequest.orderByName && queryRequest.orderByDir) {
      orderBy.push([queryRequest.orderByName, queryRequest.orderByDir]);
    }

    const offset = (pageNumber - 1) * pageSize;
    const { count, rows } = await model.findAndCountAll({
      where: criteria,
      order: orderBy,
      offset: offset,
      limit: pageSize,
      include: { all: true, nested: true }, // TODO this should only return row data needed not nested entities
    });

    const response = new QueryResponse<Entity>();
    response.resultList = rows as unknown as Entity[];
    response.totalCount = count;

    return response;
  }
}
