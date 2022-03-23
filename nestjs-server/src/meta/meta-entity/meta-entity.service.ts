import { Injectable, Logger } from '@nestjs/common';
import { OrmService } from '../../orm/orm.service';
import {
  AttributeType,
  EntityType,
  MetaAttribute,
  MetaEntity,
} from '../../domain/meta.entity';
import { EntityResponse } from '../../domain/response/entity.response';
import { DataTypes } from 'sequelize';
import { FileRepositoryService } from '../../file/file-repository.service';
import { ModelCtor } from 'sequelize-typescript';
import { DeleteAttributeRequest } from './delete-attribute.request';

@Injectable()
export class MetaEntityService {
  static readonly META_ENTITY_DIR = 'meta/entities';

  private readonly logger = new Logger(MetaEntityService.name);

  constructor(
    protected readonly ormService: OrmService,
    protected readonly fileRepositoryService: FileRepositoryService,
  ) {}

  async findAll(): Promise<MetaEntity[]> {
    console.log('About to list all files');
    const resultList: MetaEntity[] = [];
    const fileNames = await this.fileRepositoryService.listFiles(
      MetaEntityService.META_ENTITY_DIR,
    );

    console.log(`Found: ${fileNames}`);

    if (fileNames && fileNames.length > 0) {
      for (const nextName of fileNames) {
        const metaEntity = await this.findOne(this.toMetaName(nextName));
        resultList.push(metaEntity);
      }
    }
    return resultList;
  }

  async findOne(metaName: string): Promise<MetaEntity> {
    const metaFileName =
      MetaEntityService.META_ENTITY_DIR + '/' + this.toFileName(metaName);
    const metaEntityFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(metaFileName),
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
  }

  async create(metaEntity: MetaEntity): Promise<EntityResponse> {
    const metaFileName =
      MetaEntityService.META_ENTITY_DIR +
      '/' +
      this.toFileName(metaEntity.name);

    await this.fileRepositoryService.writeFile(
      metaFileName,
      JSON.stringify(metaEntity, null, 2),
    );

    return;
  }

  async update(metaEntity: MetaEntity): Promise<EntityResponse> {
    const metaFileName =
      MetaEntityService.META_ENTITY_DIR +
      '/' +
      this.toFileName(metaEntity.name);

    await this.fileRepositoryService.writeFile(
      metaFileName,
      JSON.stringify(metaEntity, null, 2),
    );

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

    const entityModelMap = new Map<string, any>();
    for (const nextMetaEntity of databaseEntities) {
      const modelAttributeList = {};
      for (const nextMetaAttribute of nextMetaEntity.attributes) {
        let modelAttribute;
        if (
          nextMetaAttribute.type === AttributeType.Identifier ||
          nextMetaAttribute.type === AttributeType.Text
        ) {
          modelAttribute = {
            type: DataTypes.STRING,
            allowNull: true,
          };

          if (nextMetaAttribute.name === 'id') {
            modelAttribute['primaryKey'] = true;
          }
        }

        if (nextMetaAttribute.type === AttributeType.Html) {
          modelAttribute = {
            type: DataTypes.TEXT,
            allowNull: true,
          };
        }

        if (nextMetaAttribute.type === AttributeType.Date) {
          modelAttribute = {
            type: DataTypes.DATEONLY,
            allowNull: true,

            // This little bit of ugly is needed to deal with how the FormGroups need to be
            // initialised with a value (e.g. '') but the current sequelize logic doesn't
            // convert empty string date values into null.
            set(value: any) {
              if (value != null && value.length === 0) {
                value = null;
              }
              this.setDataValue(nextMetaAttribute.name, value);
            },
          };
        }

        if (nextMetaAttribute.type === AttributeType.Integer) {
          modelAttribute = {
            type: DataTypes.INTEGER,
            allowNull: true,
          };
        }

        if (modelAttribute) {
          modelAttributeList[nextMetaAttribute.name] = modelAttribute;
        }
      }

      const entityModel = this.ormService.sequelize.define(
        nextMetaEntity.name,
        modelAttributeList,
        {
          freezeTableName: true,
        },
      );

      entityModelMap.set(nextMetaEntity.name, entityModel);
    }

    // second pass create the relationships
    for (const nextMetaEntity of databaseEntities) {
      for (const nextMetaAttribute of nextMetaEntity.attributes) {
        if (this.isRelationshipType(nextMetaAttribute.type)) {
          const sourceModel = entityModelMap.get(
            nextMetaEntity.name,
          ) as ModelCtor;

          const targetModel = entityModelMap.get(
            nextMetaAttribute.relationshipTarget,
          ) as ModelCtor;

          switch (nextMetaAttribute.type) {
            case AttributeType.OneToMany:
              console.log(`Adding ${nextMetaAttribute.name}`);
              sourceModel.hasMany(targetModel, {
                as: nextMetaAttribute.name,
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              });
              targetModel.belongsTo(sourceModel);
              break;
            case AttributeType.OneToOne:
              sourceModel.belongsTo(targetModel, {
                as: nextMetaAttribute.name,
                foreignKey: { name: nextMetaAttribute.name + '_id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              });
              //targetModel.belongsTo(sourceModel);
              break;
            case AttributeType.ManyToOne:
              sourceModel.belongsTo(targetModel, {
                as: nextMetaAttribute.name,
                foreignKey: { name: nextMetaAttribute.name + '_id' },
                // don't cascade updates into target model
              });
              // targetModel doesn't care about source model
              break;
            default:
              throw new Error(
                `Attribute ${nextMetaAttribute.name} has an unknown relationship type of ${nextMetaAttribute.type}`,
              );
          }
        }
      }
    }

    if (alterDatabase) {
      for (const nextModel of entityModelMap.values()) {
        await nextModel.sync({ alter: true });
      }
    }
  }

  isRelationshipType(type: AttributeType) {
    const relationShipTypes = [
      AttributeType.OneToMany,
      AttributeType.OneToOne,
      AttributeType.ManyToOne,
    ];
    return relationShipTypes.includes(type);
  }

  async deleteAttribute(deleteRequest: DeleteAttributeRequest): Promise<void> {
    if (
      deleteRequest &&
      deleteRequest.metaName &&
      deleteRequest.attributeName
    ) {
      this.logger.log(`deleteAttribute(): ${JSON.stringify(deleteRequest)}`);

      if (deleteRequest.deleteAttribute || deleteRequest.deleteDatabaseCol) {
        const metaEntity = await this.findOne(deleteRequest.metaName);
        const attributeIdx = metaEntity.attributes.findIndex(
          (x) => x.name === deleteRequest.attributeName,
        );

        if (attributeIdx >= 0) {
          if (deleteRequest.deleteDatabaseCol) {
            const sql = `Alter table "${metaEntity.name}" drop column "${deleteRequest.attributeName}";`;
            await this.ormService.sequelize.query(sql);
            await this.syncMetaModelWithDatabase(false);
          }

          if (deleteRequest.deleteAttribute) {
            metaEntity.attributes.splice(attributeIdx, 1);
            await this.update(metaEntity);
          }

          // now reload the ORM config because model definitions may have changed
          await this.ormService.reload();
          await this.syncMetaModelWithDatabase(false); // false because we've already deleted the col here
        } else {
          // This is an important security check because it defends against the SQL injection we could
          // otherwise get above. Since the supplied name must match the MetaEntity attribute name we
          // should be ok against SQL injection.
          throw new Error(
            `Unable to find attribute ${deleteRequest.attributeName} in meta entity ${deleteRequest.metaName}`,
          );
        }
      }
      // else nothing to do so keep calm and carry on

      return;
    } else {
      throw new Error(
        `Invalid delete request of: ${JSON.stringify(deleteRequest)}`,
      );
    }
  }
}
