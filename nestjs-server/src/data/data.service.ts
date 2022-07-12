import { Injectable, Logger } from '@nestjs/common';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';
import { OrmService } from '../orm/orm.service';
import { QueryRequest } from './query.request';
import {
  AttributeType,
  ComparisonOperator,
  DiscriminatorAttribute,
  MetaAttribute,
  MetaEntity,
} from '../domain/meta.entity';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import * as uuid from 'uuid';
import { UpdateSortIndexRequest } from './update-sort-index.request';
import { AuditAction } from '../domain/audit';
import { QueryService } from './query.service';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly ormService: OrmService,
    protected readonly queryService: QueryService,
  ) {}

  validateUuid(value: string) {
    try {
      uuid.parse(value);
    } catch (error) {
      throw new Error(`Invalid UUID of ${value}`);
    }
  }

  async save(entityName: string, entity: Entity): Promise<EntityResponse> {
    try {
      console.log(`save(${entityName}) ${JSON.stringify(entity)}`);

      const result = await this.ormService.sequelize.transaction(async () => {
        return this.saveInternal(entityName, entity);
      });

      return result;
    } catch (error) {
      console.error('save() failed:', error);
      throw error;
    }
  }

  private async saveInternal(entityName: string, entity: Entity) {
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

    let action;
    if (!entityModel) {
      // if entityModel was not found, or entity did not arrive with id
      action = AuditAction.Create;
      entityModel = await model.create(entity as any);
    } else {
      // else entityModel was found
      action = AuditAction.Update;
      entityModel.set(entity);
      await entityModel.save();
    }

    const metaEntity = metaEntityMap.get(entityName);
    if (!metaEntity) {
      throw new Error(`Unable to find MetaEntity ${entityName}`);
    }

    // recursively save all the children (excluding the Poly ones)
    await this.saveTheChildren(metaEntityMap, metaEntity, entity, entityModel);

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
    parentEntityModel: any,
  ) {
    for (const attribute of parentMetaEntity.attributes) {
      switch (attribute.type) {
        case AttributeType.OneToMany:
          await this.saveListOfChildren(
            metaEntityMap,
            parentEntity,
            parentEntityModel,
            parentMetaEntity,
            attribute,
          );
          break;
        case AttributeType.OneToOne:
          await this.saveOneToOne(
            metaEntityMap,
            parentEntity,
            parentEntityModel,
            attribute,
          );
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

    await this.deleteMissingChildrenPoly(
      parentEntity,
      parentMetaEntity,
      attribute,
      discriminator,
    );

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
          await this.saveInternal(childEntityName, childEntity);
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
    parentEntityModel: any,
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
          childEntityModel = await childModel.findByPk(childEntity.id);
          //childEntityModel = existingChildren.get(childEntity.id);
        } else {
          childEntity.id = uuid.v4();
        }

        if (!childEntityModel) {
          childEntityModel = await childModel.create(childEntity as any);
        }

        const metaEntity = metaEntityMap.get(
          relationshipAttribute.relationshipTarget,
        );
        if (!metaEntity) {
          throw new Error(
            `Unable to find MetaEntity ${relationshipAttribute.relationshipTarget}`,
          );
        }

        await this.saveTheChildren(
          metaEntityMap,
          metaEntity,
          childEntity,
          childEntityModel,
        );

        // childEntityModel.set(childEntity);
        // childEntityModel[parentMetaEntity.name + 'Id'] = parentEntity.id;
        // childEntityModel.save();

        // const fnName: string = this.addAssociationFunctionName(
        //   relationshipAttribute.name,
        // );
        // console.log(`fnName = ${fnName}`);
        // parentEntityModel[fnName](childEntityModel);

        this.addOneToManyAssociation(
          parentEntityModel,
          childEntityModel,
          relationshipAttribute,
        );
      }
    }
  }

  private capitalizeFirstLetter(relationshipName: string): string {
    return relationshipName.charAt(0).toUpperCase() + relationshipName.slice(1);
  }

  private setOneToOneAssociation(
    parentModel: any,
    childModel: any,
    attribute: MetaAttribute,
  ) {
    parentModel[`set${this.capitalizeFirstLetter(attribute.name)}`](childModel);
  }

  private addOneToManyAssociation(
    parentModel: any,
    childModel: any,
    attribute: MetaAttribute,
  ) {
    parentModel[`add${this.capitalizeFirstLetter(attribute.name)}`](childModel);
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
        attributeType: AttributeType.Identifier,
        operator: ComparisonOperator.Equals,
        value: parentEntity.id,
      },
    ];

    // execute the search and get a list of children back
    const childListResults = await this.queryService.findByCriteria(
      queryRequest,
    );

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

  private async deleteMissingChildrenPoly(
    parentEntity: Entity,
    parentMetaEntity: MetaEntity,
    relationshipAttribute: MetaAttribute,
    discriminator: DiscriminatorAttribute,
  ) {
    let childList = parentEntity[relationshipAttribute.name] as any[];
    if (!childList) {
      childList = []; // Even if there are no children now, we still need to check the database
    }

    // query the database for every entity mapping
    for (const nextEntityMapping of discriminator.entityMappingList) {
      // create a criteria search that will look for the children in this entityMapping that belong to the parent
      const queryRequest = new QueryRequest();
      queryRequest.metaEntityName = nextEntityMapping.metaEntityName;
      queryRequest.criteria = [
        {
          name: parentMetaEntity.name.toLowerCase() + '_id',
          attributeType: AttributeType.Identifier,
          operator: ComparisonOperator.Equals,
          value: parentEntity.id,
        },
      ];

      // execute the search and get a list of children back
      const existingChildListResponse = await this.queryService.findByCriteria(
        queryRequest,
      );
      const existingChildList = existingChildListResponse.resultList;

      // check if any of the entities found still exist in the relationship
      for (const nextExistingChild of existingChildList) {
        const childFound =
          childList.find((x) => x.id === nextExistingChild.id) >= 0;

        // if not found in the current parent object graph then delete the child so the database matches the new parent
        if (!childFound) {
          await this.destroy(
            nextEntityMapping.metaEntityName,
            nextExistingChild.id,
          );
        }
      }
    }
  }

  private async saveOneToOne(
    metaEntityMap: Map<string, MetaEntity>,
    parentEntity: Entity,
    parentEntityModel: any,
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
      childEntityModel = await childModel.create(childEntity as any);
    }

    // recurse down into the children of this child (if needed)
    await this.saveTheChildren(
      metaEntityMap,
      metaEntity,
      childEntity,
      childEntityModel,
    );

    // childEntityModel.set(childEntity);
    // childEntityModel.save();
    // parentEntity[relationshipAttribute.name + '_id'] = childEntity.id;

    // const fnName: string = this.addAssociationFunctionName(
    //   relationshipAttribute.name,
    // );
    // console.log(`fnName = ${fnName}`);
    // parentEntityModel[fnName](childEntityModel);

    this.setOneToOneAssociation(
      parentEntityModel,
      childEntityModel,
      relationshipAttribute,
    );
  }

  private async saveManyToOne(
    metaEntityMap: Map<string, MetaEntity>,
    parentEntity: Entity,
    relationshipAttribute: MetaAttribute,
  ) {
    // const childEntity = parentEntity[relationshipAttribute.name] as Entity;
    // if (!childEntity) {
    //   return;
    // }
    //
    // parentEntity[relationshipAttribute.name + '_id'] = childEntity.id;
    if (parentEntity[relationshipAttribute.name + '_id'] === '') {
      parentEntity[relationshipAttribute.name + '_id'] = null;
    }
  }

  archive(entityName: string, id: string): Promise<void> {
    return;
  }

  purge(): Promise<void> {
    return;
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
    const queryResponse = await this.queryService.findAll(
      updateSortIndexRequest.metaName,
    );
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
}
