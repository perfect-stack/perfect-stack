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
import { AuditAction } from '../domain/audit';

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
    const entityModel = await model.findByPk(id, {
      include: { all: true, nested: true },
    });

    const entity = entityModel.toJSON();

    const metaEntity = await this.metaEntityService.findOne(entityName);
    for (const attribute of metaEntity.attributes) {
      if (attribute.type === AttributeType.OneToPoly) {
        await this.loadOneToPoly(metaEntity, entity, attribute);
      }
    }

    return entity;
  }

  private async loadOneToPoly(
    metaEntity: MetaEntity,
    entity: Entity,
    attribute: MetaAttribute,
  ) {
    const entityFk = metaEntity.name.toLowerCase() + '_id';
    if (!entity[attribute.name]) {
      entity[attribute.name] = [];
    }

    const discriminator = attribute.discriminator;
    for (const entityMapping of discriminator.entityMappingList) {
      const queryRequest = new QueryRequest();
      queryRequest.metaEntityName = entityMapping.metaEntityName;
      queryRequest.criteria = [
        {
          name: entityFk,
          value: entity.id,
          operator: ComparisonOperator.Equals,
        },
      ];
      const queryResponse = await this.findByCriteria(queryRequest);

      if (queryResponse.resultList.length > 0) {
        entity[attribute.name].push(...queryResponse.resultList);
      }
    }
  }

  validateUuid(value: string) {
    try {
      uuid.parse(value);
    } catch (error) {
      throw new Error(`Invalid UUID of ${value}`);
    }
  }

  async save(entityName: string, entity: Entity): Promise<EntityResponse> {
    console.log(`save(${entityName}) ${JSON.stringify(entity)}`);

    const metaEntityList = await this.metaEntityService.findAll();
    const metaEntityMap = new Map<string, MetaEntity>();
    for (const nextMetaEntity of metaEntityList) {
      metaEntityMap.set(nextMetaEntity.name, nextMetaEntity);
    }

    const model = this.ormService.sequelize.model(entityName);

    // entity may arrive with or without an id, and may exist or not exist in the database
    let entityModel;
    if (entity.id) {
      this.validateUuid(entity.id);
      entityModel = await model.findByPk(entity.id);
    } else {
      entity.id = uuid.v4();
    }

    const metaEntity = metaEntityMap.get(entityName);
    if (!metaEntity) {
      throw new Error(`Unable to find MetaEntity ${entityName}`);
    }

    // recursively save all the children (excluding the Poly ones)
    await this.saveTheChildren(metaEntityMap, metaEntity, entity);

    let action;
    if (!entityModel) {
      // if entityModel was not found, or entity did not arrive with id
      action = AuditAction.Create;
      entityModel = await model.create(entity);
    } else {
      // else entityModel was found
      action = AuditAction.Update;
      entityModel.set(entity);
      await entityModel.save();
    }

    // recursively save all Poly relationships
    await this.saveAllPolys(metaEntityMap, metaEntity, entity);

    return {
      action: action,
      entity: entityModel,
    };
  }

  private async saveTheChildren(
    metaEntityMap: Map<string, MetaEntity>,
    parentMetaEntity: MetaEntity,
    parentEntity: Entity,
  ) {
    for (const attribute of parentMetaEntity.attributes) {
      switch (attribute.type) {
        case AttributeType.OneToMany:
          await this.saveListOfChildren(
            metaEntityMap,
            parentEntity,
            parentMetaEntity,
            attribute,
          );
          break;
        case AttributeType.OneToOne:
          await this.saveOneToOne(metaEntityMap, parentEntity, attribute);
          break;
        case AttributeType.ManyToOne:
          await this.saveManyToOne(metaEntityMap, parentEntity, attribute);
          break;
        // case AttributeType.OneToPoly:
        //   await this.saveOneToPoly(parentEntity, parentMetaEntity, attribute);
        //   break;
        default:
        // Do nothing
      }
    }
  }

  private async saveAllPolys(
    metaEntityMap: Map<string, MetaEntity>,
    parentMetaEntity: MetaEntity,
    parentEntity: Entity,
  ) {
    for (const attribute of parentMetaEntity.attributes) {
      if (attribute.type === AttributeType.OneToPoly) {
        await this.saveOneToPoly(
          metaEntityMap,
          parentEntity,
          parentMetaEntity,
          attribute,
        );
      }
    }
  }

  private async saveOneToPoly(
    metaEntityMap: Map<string, MetaEntity>,
    parentEntity: Entity,
    parentMetaEntity: MetaEntity,
    attribute: MetaAttribute,
  ) {
    const discriminator = attribute.discriminator;
    if (!discriminator) {
      throw new Error(
        `Unable to find discriminator for attribute "${attribute.name}" in entity "${parentMetaEntity.name}"`,
      );
    }

    const discriminatorName = discriminator.discriminatorName;
    if (!discriminatorName) {
      `Unable to find discriminator attribute name for attribute ${attribute.name} in entity ${parentMetaEntity.name}`;
    }

    const listOfChildren = parentEntity[attribute.name] as [];
    for (let i = 0; i < listOfChildren.length; i++) {
      const childEntity: any = listOfChildren[i];
      const discriminatorValue = childEntity[discriminatorName];
      if (discriminatorValue) {
        const childEntityMapping = discriminator.entityMappingList.find(
          (a) => a.discriminatorValue === discriminatorValue,
        );
        if (childEntityMapping) {
          const childFk = parentMetaEntity.name.toLowerCase() + '_id';
          childEntity[childFk] = parentEntity.id;
          const childEntityName = childEntityMapping.metaEntityName;
          await this.save(childEntityName, childEntity);
        } else {
          throw new Error(
            `Unable to find entity mapping for discriminator value ${discriminatorValue} in entity mapping of ${JSON.stringify(
              discriminator.entityMappingList,
            )}`,
          );
        }
      } else {
        throw new Error(
          `Attribute ${attribute.name} in entity ${parentMetaEntity.name} has child at position ${i} that has no discriminator value for the discriminator attribute of ${discriminatorName}`,
        );
      }
    }
  }

  private async saveListOfChildren(
    metaEntityMap: Map<string, MetaEntity>,
    parentEntity: Entity,
    parentMetaEntity: MetaEntity,
    relationshipAttribute: MetaAttribute,
  ) {
    const childModel = await this.ormService.sequelize.model(
      relationshipAttribute.relationshipTarget,
    );

    const childList = parentEntity[relationshipAttribute.name] as any[];
    if (childList) {
      console.log(
        `saveListOfChildren(${relationshipAttribute.name}) with ${childList.length} items`,
      );

      const existingChildren: Map<string, any> =
        await this.findExistingChildren(
          parentEntity,
          parentMetaEntity,
          relationshipAttribute,
        );

      await this.deleteMissingChildren(
        parentEntity,
        parentMetaEntity,
        relationshipAttribute,
        existingChildren,
      );

      for (const nextChild of childList) {
        const childEntity = nextChild as Entity;

        let childEntityModel = null;
        if (childEntity.id) {
          this.validateUuid(childEntity.id);
          //childEntityModel = await childModel.findByPk(childEntity.id);
          childEntityModel = existingChildren.get(childEntity.id);
        } else {
          childEntity.id = uuid.v4();
        }

        if (!childEntityModel) {
          childEntityModel = await childModel.create(childEntity);
        }

        const metaEntity = metaEntityMap.get(
          relationshipAttribute.relationshipTarget,
        );
        if (!metaEntity) {
          throw new Error(
            `Unable to find MetaEntity ${relationshipAttribute.relationshipTarget}`,
          );
        }

        await this.saveTheChildren(metaEntityMap, metaEntity, childEntity);

        childEntityModel.set(childEntity);
        childEntityModel[parentMetaEntity.name + 'Id'] = parentEntity.id;
        childEntityModel.save();
      }
    }
  }

  private async findExistingChildren(
    parentEntity: Entity,
    parentMetaEntity: MetaEntity,
    relationshipAttribute: MetaAttribute,
  ): Promise<Map<string, any>> {
    // create a criteria search that will look for the children of this entity
    const queryRequest = new QueryRequest();
    queryRequest.metaEntityName = relationshipAttribute.relationshipTarget;
    queryRequest.criteria = [
      {
        name: parentMetaEntity.name + 'Id',
        operator: ComparisonOperator.Equals,
        value: parentEntity.id,
      },
    ];

    // execute the search and get a list of children back
    const childListResults = await this.findByCriteria(queryRequest);

    // convert into a map for later consumption
    const childrenMap = new Map<string, any>();
    childListResults.resultList.forEach((e) => childrenMap.set(e.id, e));

    return childrenMap;
  }

  private async deleteMissingChildren(
    parentEntity: Entity,
    parentMetaEntity: MetaEntity,
    relationshipAttribute: MetaAttribute,
    existingChildren: Map<string, any>,
  ) {
    // for each existing child, if it doesn't exist in the new parent's list of child then we now need to delete it from the database and the map
    const incomingChildList = parentEntity[relationshipAttribute.name] as any[];
    for (const childKey of existingChildren.keys()) {
      const incomingChild = incomingChildList.find((x) => x.id === childKey);
      if (!incomingChild) {
        const existingChild = existingChildren.get(childKey);
        existingChildren.delete(childKey);
        existingChild.destroy();
      }
    }
  }

  private async saveOneToOne(
    metaEntityMap: Map<string, MetaEntity>,
    parentEntity: Entity,
    relationshipAttribute: MetaAttribute,
  ) {
    const metaEntity = await metaEntityMap.get(
      relationshipAttribute.relationshipTarget,
    );
    if (!metaEntity) {
      throw new Error(
        `Unable to find MetaEntity ${relationshipAttribute.relationshipTarget}`,
      );
    }

    const childEntity = parentEntity[relationshipAttribute.name] as Entity;
    if (!childEntity) {
      return;
    }

    let childEntityModel;

    if (childEntity.id) {
      this.validateUuid(childEntity.id);
      const childModel = await this.ormService.sequelize.model(
        relationshipAttribute.relationshipTarget,
      );
      childEntityModel = await childModel.findByPk(childEntity.id);
    } else {
      childEntity.id = uuid.v4();
    }

    if (!childEntityModel) {
      const childModel = await this.ormService.sequelize.model(
        relationshipAttribute.relationshipTarget,
      );
      childEntityModel = await childModel.create(childEntity);
    }

    // recurse down into the children of this child (if needed)
    await this.saveTheChildren(metaEntityMap, metaEntity, childEntity);

    childEntityModel.set(childEntity);
    childEntityModel.save();
    parentEntity[relationshipAttribute.name + '_id'] = childEntity.id;
  }

  private async saveManyToOne(
    metaEntityMap: Map<string, MetaEntity>,
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
    operatorMap.set(ComparisonOperator.InsensitiveStartsWith, Op.iLike);

    for (const nextCriteria of queryRequest.criteria) {
      let value = nextCriteria.value;
      if (nextCriteria.operator === ComparisonOperator.InsensitiveStartsWith) {
        value = this.appendWildcard(value);
      }

      if (nextCriteria.operator === ComparisonOperator.InsensitiveLike) {
        value = this.wrapWithWildcards(value);
      }

      if (nextCriteria.value && nextCriteria.value !== 'null') {
        if (nextCriteria.operator) {
          const op = operatorMap.get(nextCriteria.operator);
          if (op) {
            criteria[nextCriteria.name] = {
              [op]: value,
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

  async destroy(entityName: string, id: string) {
    const model = this.ormService.sequelize.model(entityName);
    return model.destroy({
      where: {
        id: id,
      },
    });
  }

  private wrapWithWildcards(value: string) {
    if (value) {
      value = value.startsWith('%') ? value : `%${value}`;
      value = value.endsWith('%') ? value : `${value}%`;
    }
    return value;
  }

  private appendWildcard(value: string) {
    if (value) {
      value = value.endsWith('%') ? value : `${value}%`;
    }
    return value;
  }
}
