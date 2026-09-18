import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import {
  DataService,
  QueryService,
  MetaEntityService,
  OrmService,
} from '@perfect-stack/nestjs-server';

export class CustomWorld extends World {
  // Service references
  dataService!: DataService;
  queryService!: QueryService;
  metaEntityService!: MetaEntityService;
  ormService!: OrmService;

  // Scenario state
  currentEntityName?: string;
  currentEntity: any;
  savedEntity: any;
  retrievedEntity: any;
  lastResponse: any;
  lastError: any;
  contextData: Record<string, any> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
