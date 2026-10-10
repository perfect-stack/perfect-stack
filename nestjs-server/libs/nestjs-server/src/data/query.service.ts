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
    const includes = await this.buildFindOneIncludes(entityName, 1, 4);

    const entityModel = await model.findByPk(id, {
      include: includes.length > 0 ? includes : undefined,
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

  async buildFindOneIncludes(
    entityName: string,
    currentDepth: number = 1,
    maxDepth: number = 4,
  ): Promise<any[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const metaEntity = await this.metaEntityService.findOne(entityName);
    if (!metaEntity) {
      return [];
    }

    const includes: any[] = [];

    for (const attr of metaEntity.attributes) {
      // Rule 1: ManyToOne and OneToOne references (e.g. parent_event, location, protocol)
      // Only fetch 1 level so display label is available. Never recurse into children.
      if (
        attr.type === AttributeType.ManyToOne ||
        attr.type === AttributeType.OneToOne
      ) {
        if (this.ormService.sequelize.isDefined(attr.relationshipTarget)) {
          const targetModel = this.ormService.sequelize.model(
            attr.relationshipTarget,
          );
          if (targetModel) {
            includes.push({
              model: targetModel,
              as: attr.name,
              required: false,
            });
          }
        }
      }

      // Rule 2: OneToMany child collections (e.g. occurrences -> activities -> assertions)
      // Recurse downwards down the ownership hierarchy. For self-references, load 1 level only without recursing.
      if (attr.type === AttributeType.OneToMany) {
        if (this.ormService.sequelize.isDefined(attr.relationshipTarget)) {
          const targetModel = this.ormService.sequelize.model(
            attr.relationshipTarget,
          );
          if (targetModel) {
            if (attr.relationshipTarget === entityName) {
              if (currentDepth === 1) {
                includes.push({
                  model: targetModel,
                  as: attr.name,
                  required: false,
                });
              }
            } else {
              const nestedIncludes = await this.buildFindOneIncludes(
                attr.relationshipTarget,
                currentDepth + 1,
                maxDepth,
              );
              const includeItem: any = {
                model: targetModel,
                as: attr.name,
                required: false,
              };
              if (nestedIncludes.length > 0) {
                includeItem.include = nestedIncludes;
              }
              includes.push(includeItem);
            }
          }
        }
      }
    }

    return includes;
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
    treeType?: string,
  ): Promise<any> {
    const metaEntity = await this.metaEntityService.findOne(entityName);
    if (!metaEntity) {
      throw new DataNotFound();
    }

    const parentAttr = metaEntity.attributes.find(
      (a) =>
        a.type === AttributeType.ManyToOne &&
        a.relationshipTarget === metaEntity.name,
    );

    const isEntityChain =
      treeType === 'EntityChain' ||
      (!parentAttr && !metaEntity.treeNode);

    if (isEntityChain) {
      return this.findEntityChainTree(entityName, rootId, depth);
    }

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

    // 1. Identify any child OneToMany collections on this entity (e.g. "occurrences")
    const childCollections = metaEntity.attributes.filter(
      (a) =>
        a.type === AttributeType.OneToMany &&
        a.relationshipTarget !== entityName,
    );

    const allIds = rows.map((r: any) => r.id);

    // 2. Fetch children for all returned nodes in one query using bounded includes
    const childDataMap = new Map<string, Map<string, any[]>>();
    for (const childAttr of childCollections) {
      if (this.ormService.sequelize.isDefined(childAttr.relationshipTarget)) {
        const childModel = this.ormService.sequelize.model(
          childAttr.relationshipTarget,
        );
        const candidateFkNames = [
          entityName.toLowerCase() + '_id',
          entityName + 'Id',
          entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id',
        ];
        let foreignKeyName = candidateFkNames[0];
        if (childModel && childModel.rawAttributes) {
          for (const cand of candidateFkNames) {
            if (childModel.rawAttributes[cand]) {
              foreignKeyName = cand;
              break;
            }
          }
        }

        const childIncludes = await this.buildFindOneIncludes(
          childAttr.relationshipTarget,
          1,
          3,
        );

        const children = await childModel.findAll({
          where: { [foreignKeyName]: { [Op.in]: allIds } },
          include: childIncludes.length > 0 ? childIncludes : undefined,
        });

        const grouped = new Map<string, any[]>();
        for (const c of children) {
          const raw = typeof c.toJSON === 'function' ? c.toJSON() : c;
          const parentFk = raw[foreignKeyName];
          if (parentFk) {
            if (!grouped.has(parentFk)) grouped.set(parentFk, []);
            grouped.get(parentFk)!.push(raw);
          }
        }
        childDataMap.set(childAttr.name, grouped);
      }
    }

    // 3. Attach child collections to each node when building nodeMap
    const nodeMap = new Map<string, any>();
    for (const row of rows) {
      const nodeData: any = {
        ...row,
        [childrenAttrName]: [],
      };
      for (const childAttr of childCollections) {
        const items = childDataMap.get(childAttr.name)?.get(row.id) || [];
        nodeData[childAttr.name] = items;
      }
      nodeMap.set(row.id, nodeData);
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

  private async findEntityChainTree(
    entityName: string,
    rootId?: string,
    depth?: number,
  ): Promise<any> {
    const model = this.ormService.sequelize.model(entityName);
    const effectiveDepth =
      depth != null && !isNaN(Number(depth)) ? Number(depth) : 5;
    const includes = await this.buildIncludeTree(entityName, 1, effectiveDepth);

    const findOptions: any = {};
    if (includes.length > 0) {
      findOptions.include = includes;
    }

    if (rootId) {
      const record = await model.findByPk(rootId, findOptions);
      if (!record) {
        throw new DataNotFound();
      }
      return this.mapEntityToTreeNode(entityName, record.toJSON());
    } else {
      const records = await model.findAll(findOptions);
      const rawList = records.map((r: any) => r.toJSON());
      return Promise.all(
        rawList.map((item: any) => this.mapEntityToTreeNode(entityName, item)),
      );
    }
  }

  private async buildIncludeTree(
    entityName: string,
    currentDepth: number,
    maxDepth: number,
  ): Promise<any[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const metaEntity = await this.metaEntityService.findOne(entityName);
    if (!metaEntity) {
      return [];
    }

    const includes: any[] = [];
    const oneToManyAttrs = metaEntity.attributes.filter(
      (a) =>
        a.type === AttributeType.OneToMany &&
        a.relationshipTarget !== entityName,
    );

    for (const attr of oneToManyAttrs) {
      const targetModel = this.ormService.sequelize.model(
        attr.relationshipTarget,
      );
      if (targetModel) {
        const nestedIncludes = await this.buildIncludeTree(
          attr.relationshipTarget,
          currentDepth + 1,
          maxDepth,
        );
        const includeItem: any = {
          model: targetModel,
          as: attr.name,
          required: false,
        };
        if (nestedIncludes.length > 0) {
          includeItem.include = nestedIncludes;
        }
        includes.push(includeItem);
      }
    }

    return includes;
  }

  private async mapEntityToTreeNode(
    entityName: string,
    entity: any,
  ): Promise<any> {
    const metaEntity = await this.metaEntityService.findOne(entityName);
    const oneToManyAttrs = metaEntity
      ? metaEntity.attributes.filter(
          (a) =>
            a.type === AttributeType.OneToMany &&
            a.relationshipTarget !== entityName,
        )
      : [];

    let label =
      entity.label ||
      entity.protocol_name ||
      entity.activity_template_name ||
      entity.assertion_type_name ||
      entity.scientific_name ||
      entity.name ||
      entity.title;

    if (!label && metaEntity) {
      const textAttr = metaEntity.attributes.find(
        (a) =>
          a.type === AttributeType.Text ||
          a.type === AttributeType.Identifier,
      );
      if (textAttr && entity[textAttr.name]) {
        label = entity[textAttr.name];
      }
    }
    if (!label) {
      label = entity.id || 'Unnamed Node';
    }

    const secondaryLabel =
      entity.secondaryLabel ||
      entity.common_name ||
      entity.code ||
      null;

    const badge = entityName;

    const children: any[] = [];
    for (const attr of oneToManyAttrs) {
      const childList = entity[attr.name];
      if (Array.isArray(childList) && childList.length > 0) {
        for (const childItem of childList) {
          const childNode = await this.mapEntityToTreeNode(
            attr.relationshipTarget,
            childItem,
          );
          children.push(childNode);
        }
      }
    }

    const isLeaf = oneToManyAttrs.length === 0 || children.length === 0;

    return {
      ...entity,
      id: entity.id,
      entityType: entityName,
      label: label,
      secondaryLabel: secondaryLabel,
      badge: badge,
      route: `/data/${entityName}/view_edit/${entity.id}`,
      children: children,
      isLeaf: isLeaf,
    };
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
