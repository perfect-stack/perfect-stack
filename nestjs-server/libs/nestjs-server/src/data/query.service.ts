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
import { Op, QueryTypes } from 'sequelize';
import { QueryResponse } from './query.response';
import { getCriteriaValue } from './query-utils';
import { DataNotFound } from './data.exception';

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

    if (entityModel) {
      const entity = entityModel.toJSON();
      const metaEntity = await this.metaEntityService.findOne(entityName);
      for (const attribute of metaEntity.attributes) {
        if (attribute.type === AttributeType.OneToPoly) {
          await this.loadOneToPoly(metaEntity, entity, attribute);
        }
      }
      return entity;
    } else {
      throw new DataNotFound();
    }
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
        for (const childEntitySearchResult of queryResponse.resultList) {
          const childEntity = await this.findOne(
            queryRequest.metaEntityName,
            childEntitySearchResult.id,
          );
          entity[attribute.name].push(childEntity);
        }
      }
    }
  }

  async findTree(
    entityName: string,
    rootId?: string,
    depth?: number,
  ): Promise<Entity> {
    const metaEntity = await this.metaEntityService.findOne(entityName);
    const parentAttr = metaEntity.attributes.find(
      (a) =>
        a.type === AttributeType.ManyToOne &&
        a.relationshipTarget === metaEntity.name,
    );
    const parentFkName = parentAttr ? parentAttr.name + '_id' : 'parent_id';
    const childrenAttr = metaEntity.attributes.find(
      (a) =>
        a.type === AttributeType.OneToMany &&
        a.relationshipTarget === metaEntity.name,
    );
    const childrenAttrName = childrenAttr ? childrenAttr.name : 'children';

    if (!rootId) {
      const model = this.ormService.sequelize.model(entityName);
      const rootRecord: any = await model.findOne({
        where: { [parentFkName]: null },
      });
      if (!rootRecord) {
        throw new DataNotFound();
      }
      rootId = rootRecord.id;
    }

    const depthClause =
      depth != null && !isNaN(Number(depth))
        ? `WHERE p.depth < ${Number(depth)}`
        : '';

    const sql = `
      WITH RECURSIVE tree_cte AS (
        SELECT *, 0 AS depth
        FROM "${entityName}"
        WHERE "id" = :rootId
        UNION ALL
        SELECT c.*, p.depth + 1
        FROM "${entityName}" c
        JOIN tree_cte p ON c."${parentFkName}" = p."id"
        ${depthClause}
      )
      SELECT * FROM tree_cte ORDER BY depth ASC, "id" ASC;
    `;

    const rows = (await this.ormService.sequelize.query(sql, {
      replacements: { rootId },
      type: QueryTypes.SELECT,
    })) as any[];

    if (!rows || rows.length === 0) {
      throw new DataNotFound();
    }

    const nodeMap = new Map<string, any>();
    for (const row of rows) {
      nodeMap.set(row.id, {
        ...row,
        [childrenAttrName]: [],
      });
    }

    let rootResult: any = null;
    for (const row of rows) {
      const node = nodeMap.get(row.id);
      if (row.id === rootId) {
        rootResult = node;
      } else {
        const parentNode = nodeMap.get(row[parentFkName]);
        if (parentNode) {
          parentNode[childrenAttrName].push(node);
        }
      }
    }

    return rootResult;
  }

  async findAncestors(entityName: string, nodeId: string): Promise<Entity[]> {
    const metaEntity = await this.metaEntityService.findOne(entityName);
    const parentAttr = metaEntity.attributes.find(
      (a) =>
        a.type === AttributeType.ManyToOne &&
        a.relationshipTarget === metaEntity.name,
    );
    const parentFkName = parentAttr ? parentAttr.name + '_id' : 'parent_id';

    const sql = `
      WITH RECURSIVE ancestors_cte AS (
        SELECT *, 0 AS level
        FROM "${entityName}"
        WHERE "id" = :nodeId
        UNION ALL
        SELECT p.*, a.level + 1
        FROM "${entityName}" p
        JOIN ancestors_cte a ON a."${parentFkName}" = p."id"
      )
      SELECT * FROM ancestors_cte ORDER BY level DESC;
    `;

    const rows = (await this.ormService.sequelize.query(sql, {
      replacements: { nodeId },
      type: QueryTypes.SELECT,
    })) as Entity[];

    if (!rows || rows.length === 0) {
      throw new DataNotFound();
    }

    return rows;
  }

  async findChildren(
    entityName: string,
    parentId: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<PageQueryResponse<Entity>> {
    const metaEntity = await this.metaEntityService.findOne(entityName);
    const parentAttr = metaEntity.attributes.find(
      (a) =>
        a.type === AttributeType.ManyToOne &&
        a.relationshipTarget === metaEntity.name,
    );
    const parentFkName = parentAttr ? parentAttr.name + '_id' : 'parent_id';

    const queryRequest = new QueryRequest();
    queryRequest.metaEntityName = entityName;
    queryRequest.pageNumber = pageNumber;
    queryRequest.pageSize = pageSize;
    queryRequest.criteria = [
      {
        name: parentFkName,
        value: parentId,
        attributeType: AttributeType.Identifier,
        operator: ComparisonOperator.Equals,
      },
    ];

    const response = await this.findByCriteria(queryRequest);
    return {
      resultList: response.resultList,
      totalCount: response.totalCount,
    };
  }

  async findByCriteria(
    queryRequest: QueryRequest,
  ): Promise<QueryResponse<any>> {
    this.logger.log(JSON.stringify(queryRequest));

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

    const isSqlite = this.ormService.sequelize.getDialect() === 'sqlite';
    const iLikeOp = isSqlite ? Op.like : Op.iLike;

    const operatorMap = new Map<string, symbol>();
    operatorMap.set(ComparisonOperator.Equals, Op.eq);
    operatorMap.set(ComparisonOperator.GreaterThan, Op.gt);
    operatorMap.set(ComparisonOperator.GreaterThanOrEqualTo, Op.gte);
    operatorMap.set(ComparisonOperator.LessThan, Op.lt);
    operatorMap.set(ComparisonOperator.LessThanOrEqualTo, Op.lte);
    operatorMap.set(ComparisonOperator.StartsWith, Op.startsWith);
    operatorMap.set(ComparisonOperator.InsensitiveStartsWith, iLikeOp);
    operatorMap.set(ComparisonOperator.InsensitiveLike, iLikeOp);

    for (const nextCriteria of queryRequest.criteria) {
      const value: any = getCriteriaValue(nextCriteria);

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
              `No SQL operator defined for application level comparison operator of ${JSON.stringify(nextCriteria.operator)}`,
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
    });

    const response = new QueryResponse<Entity>();
    response.resultList = rows as unknown as Entity[];
    response.totalCount = count;
    return response;
  }
}
