import { Injectable } from '@nestjs/common';
import { OrmService } from '../../orm/orm.service';
import {
  AttributeType,
  EntityType,
  MetaAttribute,
  MetaEntity,
} from '../../domain/meta.entity';
import { EntityResponse } from '../../domain/response/entity.response';
import { DataTypes } from 'sequelize';
import * as fs from 'fs';

@Injectable()
export class MetaEntityService {
  static readonly META_ENTITY_DIR = 'meta/entities';

  constructor(protected readonly ormService: OrmService) {}

  async findAll(): Promise<MetaEntity[]> {
    if (fs.existsSync(MetaEntityService.META_ENTITY_DIR)) {
      const resultList: MetaEntity[] = [];
      const fileNames = fs.readdirSync(MetaEntityService.META_ENTITY_DIR);
      if (fileNames && fileNames.length > 0) {
        for (const nextName of fileNames) {
          const metaEntity = await this.findOne(this.toMetaName(nextName));
          resultList.push(metaEntity);
        }
      }
      return resultList;
    } else {
      throw new Error('Meta directory does not exist');
    }
  }

  async findOne(metaName: string): Promise<MetaEntity> {
    const metaFileName =
      MetaEntityService.META_ENTITY_DIR + '/' + this.toFileName(metaName);
    if (fs.existsSync(metaFileName)) {
      const metaEntityFromFile = JSON.parse(
        fs.readFileSync(metaFileName, 'utf8'),
      );
      const metaEntity: MetaEntity = Object.assign(
        new MetaEntity(),
        metaEntityFromFile,
      );
      for (let i = 0; i < metaEntity.attributes.length; i++) {
        const nextAttribute = metaEntity.attributes[i];
        metaEntity.attributes[i] = Object.assign(
          new MetaAttribute(),
          nextAttribute,
        );
      }
      return metaEntity;
    } else {
      throw new Error(`Unable to find file for "${metaFileName}"`);
    }
  }

  create(metaEntity: MetaEntity): Promise<EntityResponse> {
    const metaFileName =
      MetaEntityService.META_ENTITY_DIR +
      '/' +
      this.toFileName(metaEntity.name);
    if (!fs.existsSync(metaFileName)) {
      fs.writeFileSync(metaFileName, JSON.stringify(metaEntity, null, 2));
    } else {
      throw new Error(
        `Create meta entity failed file exists already; ${metaFileName}`,
      );
    }

    return;
  }

  update(metaEntity: MetaEntity): Promise<EntityResponse> {
    const metaFileName =
      MetaEntityService.META_ENTITY_DIR +
      '/' +
      this.toFileName(metaEntity.name);
    if (fs.existsSync(metaFileName)) {
      fs.writeFileSync(metaFileName, JSON.stringify(metaEntity, null, 2));
    } else {
      throw new Error(
        `Update meta entity failed file does not exist; ${metaFileName}`,
      );
    }
    return;
  }

  archive(): Promise<void> {
    return;
  }

  toMetaName(filename: string) {
    if (filename.endsWith('.json')) {
      return filename.substring(0, filename.indexOf('.json'));
    } else {
      throw new Error(`File name of "${filename}" does not end with .json`);
    }
  }

  toFileName(metaName: string) {
    return metaName + '.json';
  }

  async syncMetaModelWithDatabase(alterDatabase: boolean): Promise<void> {
    const metaEntities = await this.findAll();
    const databaseEntities = metaEntities.filter(
      (me) => me.type === EntityType.Database,
    );

    for (const nextMetaEntity of databaseEntities) {
      const modelAttributeList = {};
      for (const nextMetaAttribute of nextMetaEntity.attributes) {
        const modelAttribute: any = {
          type: DataTypes.STRING,
          allowNull: true,
        };

        if (nextMetaAttribute.type === AttributeType.Date) {
          modelAttribute.type = DataTypes.DATEONLY;
        }

        if (nextMetaAttribute.name === 'id') {
          modelAttribute['primaryKey'] = true;
        }

        modelAttributeList[nextMetaAttribute.name] = modelAttribute;
      }

      const entityModel = this.ormService.sequelize.define(
        nextMetaEntity.name,
        modelAttributeList,
        {
          freezeTableName: true,
        },
      );

      if (alterDatabase) {
        await entityModel.sync({ alter: true });
      }
    }
  }
}
