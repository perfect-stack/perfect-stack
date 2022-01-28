import { Injectable } from '@nestjs/common';
import { OrmService } from '../../orm/orm.service';
import {
  AttributeType,
  EntityType,
  MetaAttribute,
  MetaEntity,
} from '../../domain/meta.entity';
import { EntityResponse } from '../../domain/response/entity.response';
import { FileRepositoryService } from '../../file/file-repository.service';
import {
  AnyEntity,
  Constructor,
  EntityMetadata,
  EntitySchema,
  MetadataDiscovery,
  MetadataValidator,
  MikroORM,
  Utils,
} from '@mikro-orm/core';

@Injectable()
export class MetaEntityService {
  static readonly META_ENTITY_DIR = 'meta/entities';

  public entitySchemaMap = new Map<string, EntitySchema>();

  constructor(
    protected readonly orm: MikroORM,
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

    for (const nextMetaEntity of databaseEntities) {
      const entityMetaData = new EntityMetadata();
      entityMetaData.name = nextMetaEntity.name;
      entityMetaData.tableName = nextMetaEntity.name;

      const properties = {};
      for (const nextMetaAttribute of nextMetaEntity.attributes) {
        let modelAttribute;
        if (
          nextMetaAttribute.type === AttributeType.Identifier ||
          nextMetaAttribute.type === AttributeType.Text
        ) {
          modelAttribute = {
            type: String,
            nullable: true,
          };

          if (nextMetaAttribute.name === 'id') {
            modelAttribute['primary'] = true;
          }
        }

        if (nextMetaAttribute.type === AttributeType.Date) {
          modelAttribute = {
            type: Date,
            nullable: true,
          };
        }

        if (modelAttribute) {
          properties[nextMetaAttribute.name] = modelAttribute;
        }
      }

      entityMetaData.properties = properties;
      const entitySchema = new EntitySchema(entityMetaData);
      this.entitySchemaMap.set(nextMetaEntity.name, entitySchema);

      //const emd = new EntityMetadata(entityMetaData);
      //this.orm.getMetadata().set(nextMetaEntity.name, emd);

      await this.orm.discoverEntity(entitySchema as any);
    }

    // if (alterDatabase) {
    //   for (const nextModel of entityModelMap.values()) {
    //     await nextModel.sync({ alter: true });
    //   }
    // }
  }

  // async discoverEntity<T>(
  //   entities: Constructor<T> | Constructor<AnyEntity>[],
  // ): Promise<void> {
  //   entities = Utils.asArray(entities);
  //   const discovery = new MetadataDiscovery(
  //     this.orm.getMetadata(),
  //     this.orm.config.getDriver().getPlatform(),
  //     this.orm.config,
  //   );
  //
  //   const tmp = await discovery.discoverReferences(entities);
  //   new MetadataValidator().validateDiscovered(
  //     [...Object.values(this.orm.getMetadata().getAll()), ...tmp],
  //     this.orm.config.get('discovery').warnWhenNoEntities!,
  //   );
  //
  //   const metadata = await discovery.processDiscoveredEntities(tmp);
  //   metadata.forEach((meta) =>
  //     this.orm.getMetadata().set(meta.className, meta),
  //   );
  //   this.orm.getMetadata().decorate(this.orm.em);
  // }

  private isRelationshipType(type: AttributeType) {
    const relationShipTypes = [
      AttributeType.OneToMany,
      AttributeType.OneToOne,
      AttributeType.ManyToOne,
    ];
    return relationShipTypes.includes(type);
  }
}
