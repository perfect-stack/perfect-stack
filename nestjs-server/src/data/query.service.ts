import { PageQueryResponse } from '../domain/response/page-query.response';
import { Entity } from '../domain/entity';
import {
  AttributeType,
  ComparisonOperator,
  MetaAttribute,
  MetaEntity,
} from '../domain/meta.entity';
import { QueryRequest } from './query.request';
import { OrmService } from '../orm/orm.service';
import { Injectable, Logger } from '@nestjs/common';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { Op } from 'sequelize';
import { QueryResponse } from './query.response';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

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
          attributeType: AttributeType.Identifier,
          operator: ComparisonOperator.Equals,
        },
      ];
      const queryResponse = await this.findByCriteria(queryRequest);

      if (queryResponse.resultList.length > 0) {
        entity[attribute.name].push(...queryResponse.resultList);
      }
    }
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

    const whereClause = { [Op.and]: [] };
    const criteriaList = whereClause[Op.and];

    const operatorMap = new Map<string, symbol>();
    operatorMap.set(ComparisonOperator.Equals, Op.eq);
    operatorMap.set(ComparisonOperator.GreaterThan, Op.gt);
    operatorMap.set(ComparisonOperator.GreaterThanOrEqualTo, Op.gte);
    operatorMap.set(ComparisonOperator.LessThan, Op.lt);
    operatorMap.set(ComparisonOperator.LessThanOrEqualTo, Op.lte);
    operatorMap.set(ComparisonOperator.StartsWith, Op.startsWith);
    operatorMap.set(ComparisonOperator.InsensitiveStartsWith, Op.iLike);

    for (const nextCriteria of queryRequest.criteria) {
      let value: any = nextCriteria.value;

      // upgrade value to the right data type, otherwise the comparison operators below don't work correctly
      value = this.convertStringToAttributeType(
        value,
        nextCriteria.attributeType,
      );

      if (nextCriteria.operator === ComparisonOperator.InsensitiveStartsWith) {
        value = this.ormService.appendWildcard(value);
      }

      if (nextCriteria.operator === ComparisonOperator.InsensitiveLike) {
        value = this.ormService.wrapWithWildcards(value);
      }

      if (
        nextCriteria.attributeType === AttributeType.Date &&
        nextCriteria.operator === ComparisonOperator.LessThanOrEqualTo
      ) {
        // update the time value of the incoming criteria value to the end of the day
        value = (value as Date).setHours(23, 59, 59, 999);
      }

      if (nextCriteria.value && nextCriteria.value !== 'null') {
        if (nextCriteria.operator) {
          const op = operatorMap.get(nextCriteria.operator);
          if (op) {
            criteriaList.push({
              [nextCriteria.name]: {
                [op]: value,
              },
            });
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
      where: whereClause,
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

  convertStringToAttributeType(
    value: string,
    attributeType: AttributeType,
  ): any {
    let result: any;
    if (value) {
      switch (attributeType) {
        case AttributeType.Date:
          result = this.convertStringToDate(value);
          break;
        case AttributeType.DateTime:
          result = this.convertStringToDateTime(value);
          break;
        default:
          // keep calm and just use value as it is
          result = value;
      }
    }

    return result;
  }

  private convertStringToDate(value: string) {
    return new Date(value);
  }

  private convertStringToDateTime(value: string) {
    return new Date(value);
  }
}
