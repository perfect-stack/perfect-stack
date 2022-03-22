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
import { UpdateSortIndexRequest } from './update-sort-index.request';

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
      //order: ['given_name'],
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
    const childModel = await this.ormService.sequelize.model(
      relationshipAttribute.relationshipTarget,
    );

    const childList = parentEntity[relationshipAttribute.name] as [];
    if (childList) {
      for (const nextChild of childList) {
        const childEntity = nextChild as Entity;

        let childEntityModel = null;
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
        if (nextCriteria.operator) {
          const op = operatorMap.get(nextCriteria.operator);
          if (op) {
            criteria[nextCriteria.name] = {
              [op]: nextCriteria.value,
            };
          } else {
            this.logger.warn(
              `No SQL operator defined for application level comparison operator of ${JSON.stringify(
                nextCriteria.operator,
              )}`,
            );
          }
        } else {
          throw new Error(
            `Criteria value for "${nextCriteria.name}" of "${nextCriteria.value}" supplied but no Comparison operator has been defined`,
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

  /**
   * Some data entities support the idea of human defined sort order. This is a feature where the user can have control
   * over the sorting order of an entity. This needs a numerical attribute called "sort_index" to be added to the entity
   * at which point the system can then use this value to determine the displayed order of a list of entities.
   *
   * This is used mostly by "Reference" data to control the order of these entities in dropdown lists.
   *
   * To update the sort_index value an operation needs to be performed on the server because that's the only place
   * where we can safely read and update the value from within a transaction.
   */
  async updateSortIndex(
    updateSortIndexRequest: UpdateSortIndexRequest,
  ): Promise<void> {
    // read all of this type of entity into memory
    const queryResponse = await this.findAll(updateSortIndexRequest.metaName);
    const entityList = queryResponse.resultList;
    entityList.sort((a, b) => {
      // TODO: probably should define an interface here and also check incoming entity
      const aSortable = a as any;
      const bSortable = b as any;
      return aSortable.sort_index - bSortable.sort_index;
    });

    // verify that the current order is correct and throw error if not
    for (let i = 0; i < entityList.length; i++) {
      const nextEntity = entityList[i] as any; // TODO: see sortable interface comment above
      if (nextEntity.sort_index !== i) {
        // Hopefully this error state never occurs. If it does it might be possible to just have a correction function
        // that sweeps through and changes the sort_index of every row, but don't want to write that until we know
        // why the application is getting into that state to start with.
        throw new Error(
          `The meta entity type of ${updateSortIndexRequest.metaName} is not in the expected sort order, please correct database state before attempting to use this function`,
        );
      }
    }

    // find the requested entity id
    const sourceIdx = entityList.findIndex(
      (x) => x.id === updateSortIndexRequest.id,
    );

    if (sourceIdx < 0) {
      throw new Error(
        `Entity not found error. Unable to find entity ${updateSortIndexRequest.id} of type ${updateSortIndexRequest.metaName}`,
      );
    }

    // calculate the new position
    const targetIdx = sourceIdx + updateSortIndexRequest.direction;

    // is the new position within the array or out of bounds
    if (targetIdx >= 0 || targetIdx <= entityList.length - 1) {
      // if inside do the swap in the direction required

      // find the entities
      const sourceEntity = entityList[sourceIdx] as any;
      const targetEntity = entityList[targetIdx] as any;

      // swap the selected entity with the target entity
      const tempIdx = targetEntity.sort_index;
      targetEntity.sort_index = sourceEntity.sort_index;
      sourceEntity.sort_index = tempIdx;

      // save both
      this.logger.log(
        `Updating sourceEntity ${sourceEntity.name} to ${sourceEntity.sort_index} and targetEntity ${targetEntity.name} to ${targetEntity.sort_index}`,
      );
      //      await this.save(updateSortIndexRequest.metaName, sourceEntity);
      //      await this.save(updateSortIndexRequest.metaName, targetEntity);

      // These entities have just been loaded, we can call save() on them directly
      sourceEntity.save();
      targetEntity.save();
    } else {
      // Do nothing but don't fail, sorting may silently bump against the ends of the array
    }
  }
}
