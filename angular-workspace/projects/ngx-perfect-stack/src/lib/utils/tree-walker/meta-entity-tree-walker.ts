import {AttributeType, MetaAttribute, MetaEntity} from '../../domain/meta.entity';

/**
 *
 */
export class MetaEntityTreeWalker {

  entityMap: Map<string, MetaEntity>;

  nameVisitors = new Map<string, Visitor>();
  typeVisitors = new Map<AttributeType, Visitor>();

  constructor(entityMap: Map<string, MetaEntity>) {
    this.entityMap = entityMap;
  }

  byName<T>(attributeName: string, visitor: Visitor) {
    if(this.nameVisitors.has(attributeName)) {
      throw new Error(`Visitor already registered for name ${attributeName}. TODO: wasn't sure if this was needed or not`);
    }
    this.nameVisitors.set(attributeName, visitor);
  }

  byType<T>(attributeType: AttributeType, visitor: Visitor) {
    if(this.nameVisitors.has(attributeType)) {
      throw new Error(`Visitor already registered for type ${attributeType}. TODO: wasn't sure if this was needed or not`);
    }
    this.typeVisitors.set(attributeType, visitor);
  }

  private isArrayType(attributeType: AttributeType) {
    return attributeType === AttributeType.OneToMany || attributeType === AttributeType.OneToPoly;
  }

  private isObjectType(attributeType: AttributeType) {
    return attributeType === AttributeType.OneToOne || attributeType === AttributeType.ManyToOne;
  }

  walk(entity: any, metaEntity: MetaEntity) {
    if(entity) {
      for(const attribute of metaEntity.attributes) {
        if(this.isArrayType(attribute.type)) {
          const valueArray = entity[attribute.name] as [];
          this.walkToArray(entity, valueArray, metaEntity, attribute);
        }
        else if(this.isObjectType(attribute.type)) {
          const value = entity[attribute.name];
          this.walkToSingleObject(entity, value, metaEntity, attribute);
        }
        else {
          const value = entity[attribute.name];
          this.walkToSimpleValue(entity, value, metaEntity, attribute);
        }
      }
    }
  }

  private walkToArray(node: any, valueArray: [], metaEntity: MetaEntity, attribute: MetaAttribute) {
    // determine the metaEntity type
    // recursively walk to the entity
    for(const nextValue of valueArray) {

      // the "type" of each element in the array can be different
      let nextMetaEntityName: string;
      switch (attribute.type) {
        case AttributeType.OneToMany:
          nextMetaEntityName = attribute.relationshipTarget;
          break;
        case AttributeType.OneToPoly:
          nextMetaEntityName = this.determineMetaEntity(nextValue, attribute);
          break;
        default:
          throw new Error(`Unknown attributeType of ${attribute.type}, for attribute ${attribute.name} in MetaEntity ${metaEntity.name}`);
      }

      if(nextMetaEntityName) {
        const nextMetaEntity = this.entityMap.get(nextMetaEntityName);
        if(nextMetaEntity) {
          this.walk(nextValue, nextMetaEntity);
        }
        else {
          throw new Error(`Unable to find the metaEntity with name ${nextMetaEntityName}, for attribute ${attribute.name} in MetaEntity ${metaEntity.name} with value ${JSON.stringify(nextValue)}`);
        }
      }
      else {
        throw new Error(`Unable to determine which MetaEntity to use, for attribute ${attribute.name} in MetaEntity ${metaEntity.name} with value ${JSON.stringify(nextValue)}`);
      }
    }
  }

  private determineMetaEntity(value: any, attribute: MetaAttribute): string {
    const discriminator = attribute.discriminator;
    if(discriminator) {
      const discriminatorValue = value[discriminator.discriminatorName];
      if(discriminatorValue) {
        const entityMapping = discriminator.entityMappingList.find(a => a.discriminatorValue === discriminatorValue);
        if(entityMapping) {
          return entityMapping.metaEntityName;
        }
      }
    }
    throw new Error(`Unable to determineMetaEntity() for attribute ${attribute.name} and value ${JSON.stringify(value)}`);
  }

  private walkToSingleObject(node: any, value: any, metaEntity: MetaEntity, attribute: MetaAttribute) {
    // is this value an object?
    // determine the next metaEntity type (we want the MetaEntity type of the value)
    // recursively walk to the entity
    const nextEntity = this.entityMap.get(attribute.relationshipTarget);
    if(nextEntity) {
      this.walk(value, nextEntity);
    }
  }

  private walkToSimpleValue(node: any, value: any, metaEntity: MetaEntity, attribute: MetaAttribute) {
    const nameVisitor = this.nameVisitors.get(attribute.name);
    if(nameVisitor) {
      nameVisitor.visit(node, value, metaEntity, attribute);
    }

    const typeVisitor = this.typeVisitors.get(attribute.type)
    if(typeVisitor) {
      typeVisitor.visit(node, value, metaEntity, attribute);
    }
  }
}

export interface Visitor {
  visit(node: any, value: any, metaEntity: MetaEntity, attribute: MetaAttribute): void;
}

/**
 * For each AttributeType.Integer, look at the value and if it is a string convert it to a number, "1" => 1
 */
export class IntegerVisitor implements Visitor {
  visit(node: any, value: number, metaEntity: MetaEntity, attribute: MetaAttribute): void {
    node[attribute.name] = value ? Number(value) : null;
  }
}

/**
 * For each AttributeType.Identifier, convert empty strings and other falsy values into nulls
 */
export class IdentifierVisitor implements Visitor {
  visit(node: any, value: number, metaEntity: MetaEntity, attribute: MetaAttribute): void {
    node[attribute.name] = value ? value : null;
  }
}
