import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  OrmModule,
  OrmService,
  MetaEntityModule,
  MetaEntityService,
  DataModule,
  DataService,
  QueryService,
} from '@perfect-stack/nestjs-server';

export interface TestHarnessContext {
  moduleRef: TestingModule;
  ormService: OrmService;
  metaEntityService: MetaEntityService;
  dataService: DataService;
  queryService: QueryService;
}

export class ServerHarness {
  private static instance: ServerHarness;
  private context: TestHarnessContext | null = null;
  private readonly dbPath: string;

  private constructor() {
    this.dbPath = path.resolve(__dirname, '../../test-database.sqlite');
  }

  public static getInstance(): ServerHarness {
    if (!ServerHarness.instance) {
      ServerHarness.instance = new ServerHarness();
    }
    return ServerHarness.instance;
  }

  public async initialize(): Promise<TestHarnessContext> {
    if (this.context) {
      return this.context;
    }

    const metaDir = path.resolve(__dirname, '../../meta');

    // Clean up any existing test sqlite database file for a fresh start
    if (fs.existsSync(this.dbPath)) {
      try {
        fs.unlinkSync(this.dbPath);
      } catch (e) {
        // Ignore if busy
      }
    }

    // Set process.env defaults for test environment
    process.env.DATABASE_DIALECT = 'sqlite';
    process.env.DATABASE_STORAGE = this.dbPath;
    process.env.DATABASE_LOGGING = 'false';
    process.env.META_SOURCE_LOCATION = 'local';
    process.env.META_SOURCE_LOCATION_DIR = metaDir;
    process.env.META_BUCKET_NAME = 'test-meta-bucket';
    process.env.MEDIA_BUCKET_NAME = 'test-media-bucket';

    const configModule = ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [
        () => ({
          DATABASE_DIALECT: 'sqlite',
          DATABASE_STORAGE: this.dbPath,
          DATABASE_LOGGING: 'false',
          META_SOURCE_LOCATION: 'local',
          META_SOURCE_LOCATION_DIR: metaDir,
          META_BUCKET_NAME: 'test-meta-bucket',
          MEDIA_BUCKET_NAME: 'test-media-bucket',
        }),
      ],
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        configModule,
        EventEmitterModule.forRoot(),
        OrmModule,
        MetaEntityModule,
        DataModule,
      ],
    }).compile();

    const ormService = moduleRef.get(OrmService);
    const metaEntityService = moduleRef.get(MetaEntityService);
    const dataService = moduleRef.get(DataService);
    const queryService = moduleRef.get(QueryService);

    this.context = {
      moduleRef,
      ormService,
      metaEntityService,
      dataService,
      queryService,
    };

    return this.context;
  }

  public async syncSchema(): Promise<void> {
    const ctx = await this.initialize();
    await ctx.metaEntityService.syncMetaModelWithDatabase(true);
  }

  public async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.moduleRef.close();
      this.context = null;
    }
    if (fs.existsSync(this.dbPath)) {
      try {
        fs.unlinkSync(this.dbPath);
      } catch (e) {
        // Ignore if busy
      }
    }
  }
}
