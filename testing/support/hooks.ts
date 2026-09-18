import { Before, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { ServerHarness } from './server/server-harness';
import { CustomWorld } from './world';

// Set default timeout to 30 seconds for DB/async operations
setDefaultTimeout(30 * 1000);

BeforeAll(async function () {
  const harness = ServerHarness.getInstance();
  await harness.initialize();
  await harness.syncSchema();
});

Before(async function (this: CustomWorld) {
  const harness = ServerHarness.getInstance();
  const ctx = await harness.initialize();

  this.dataService = ctx.dataService;
  this.queryService = ctx.queryService;
  this.metaEntityService = ctx.metaEntityService;
  this.ormService = ctx.ormService;

  this.currentEntityName = undefined;
  this.currentEntity = null;
  this.savedEntity = null;
  this.retrievedEntity = null;
  this.lastResponse = null;
  this.lastError = null;
  this.contextData = {};
});

AfterAll(async function () {
  const harness = ServerHarness.getInstance();
  await harness.cleanup();
});
