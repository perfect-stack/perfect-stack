import { Get, Injectable, Logger, Post } from '@nestjs/common';
import { PageQueryResponse } from '../domain/response/page-query.response';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';
import { OrmService } from '../orm/orm.service';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(protected readonly ormService: OrmService) {}

  @Get('/:entityName')
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
    return (await model.findByPk(id)) as unknown as Entity;
  }

  @Post('/:entityName/:id')
  async create(entityName: string, entity: Entity): Promise<EntityResponse> {
    const model = this.ormService.sequelize.model(entityName);
    return model.create(entity);
  }

  async update(entityName: string, entity: Entity): Promise<EntityResponse> {
    const model = this.ormService.sequelize.model(entityName);
    const entityFromDb = await model.findByPk(entity.id);
    entityFromDb.set(entity);
    return entityFromDb.save();
  }

  archive(entityName: string, id: string): Promise<void> {
    return;
  }

  purge(): Promise<void> {
    return;
  }
}
