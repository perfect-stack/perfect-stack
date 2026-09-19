import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../../../../support/world';
import { Entity, UpdateSortIndexRequest } from '@perfect-stack/nestjs-server';

Given(
  'a new {string} entity with the following attributes:',
  function (this: CustomWorld, entityName: string, dataTable: DataTable) {
    this.currentEntityName = entityName;
    const attributes = dataTable.rowsHash();
    this.currentEntity = {
      ...attributes,
    };
  },
);

Given(
  'with {string} child entities:',
  function (this: CustomWorld, relationshipName: string, dataTable: DataTable) {
    if (!this.currentEntity) {
      throw new Error('No current entity initialized');
    }
    const children = dataTable.hashes();
    this.currentEntity[relationshipName] = children;
  },
);

Given(
  'with a {string} child entity:',
  function (this: CustomWorld, relationshipName: string, dataTable: DataTable) {
    if (!this.currentEntity) {
      throw new Error('No current entity initialized');
    }
    const child = dataTable.rowsHash();
    this.currentEntity[relationshipName] = child;
  },
);

When('I save the entity', async function (this: CustomWorld) {
  if (!this.currentEntityName) {
    throw new Error('No current entity name specified');
  }

  // Use the updated currentEntity (or savedEntity if updating)
  const entityToSave = this.currentEntity || this.savedEntity;
  const response = await this.dataService.save(
    this.currentEntityName,
    entityToSave as unknown as Entity,
  );

  this.lastResponse = response;
  this.savedEntity = response.entity;
});

When(
  'I save the entity as {string}',
  async function (this: CustomWorld, alias: string) {
    if (!this.currentEntityName) {
      throw new Error('No current entity name specified');
    }

    const entityToSave = this.currentEntity || this.savedEntity;
    const response = await this.dataService.save(
      this.currentEntityName,
      entityToSave as unknown as Entity,
    );

    this.contextData[alias] = response.entity;
    this.lastResponse = response;
    this.savedEntity = response.entity;
  },
);

When(
  'I link the entity to {string} {string}',
  function (this: CustomWorld, relationshipName: string, alias: string) {
    const targetEntity = this.contextData[alias];
    if (!targetEntity) {
      throw new Error(`Alias ${alias} not found in scenario context`);
    }

    if (!this.currentEntity) {
      const base = this.retrievedEntity || this.savedEntity;
      this.currentEntity = typeof base.toJSON === 'function' ? base.toJSON() : { ...base };
    }

    this.currentEntity[`${relationshipName}_id`] = targetEntity.id;
  },
);

Then(
  'the entity should be saved successfully with a valid UUID',
  function (this: CustomWorld) {
    expect(this.savedEntity, 'Saved entity should exist').to.be.ok;
    const id = this.savedEntity.id;
    expect(id, 'Entity ID should be defined').to.be.a('string');
    expect(id).to.match(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      `Expected ${id} to be a valid UUID`,
    );
  },
);

When(
  'I query the {string} by its ID',
  async function (this: CustomWorld, entityName: string) {
    const targetId = this.savedEntity ? this.savedEntity.id : this.currentEntity?.id;
    if (!targetId) {
      throw new Error('No entity ID available to query');
    }

    const result = await this.queryService.findOne(entityName, targetId);
    this.retrievedEntity = result;
  },
);

Then(
  'the retrieved entity should match:',
  function (this: CustomWorld, dataTable: DataTable) {
    expect(this.retrievedEntity, 'Retrieved entity should exist').to.be.ok;
    const expected = dataTable.rowsHash();

    for (const [key, value] of Object.entries(expected)) {
      expect(this.retrievedEntity[key], `Field "${key}" mismatch`).to.equal(value);
    }
  },
);

Then(
  'the retrieved entity should have {int} {string} child records matching:',
  function (
    this: CustomWorld,
    count: number,
    relationshipName: string,
    dataTable: DataTable,
  ) {
    expect(this.retrievedEntity, 'Retrieved entity should exist').to.be.ok;
    const children = this.retrievedEntity[relationshipName];
    expect(children, `Child array "${relationshipName}" should exist`).to.be.an('array');
    expect(children.length, `Child count for "${relationshipName}"`).to.equal(count);

    const expectedRows = dataTable.hashes();
    for (let i = 0; i < expectedRows.length; i++) {
      const expected = expectedRows[i];
      const actual = children[i];
      for (const [key, val] of Object.entries(expected)) {
        expect(actual[key], `Child [${i}] field "${key}" mismatch`).to.equal(val);
      }
    }
  },
);

Then(
  'the retrieved entity should have a {string} child record matching:',
  function (
    this: CustomWorld,
    relationshipName: string,
    dataTable: DataTable,
  ) {
    expect(this.retrievedEntity, 'Retrieved entity should exist').to.be.ok;
    const child = this.retrievedEntity[relationshipName];
    expect(child, `Child object "${relationshipName}" should exist`).to.be.ok;

    const expected = dataTable.rowsHash();
    for (const [key, val] of Object.entries(expected)) {
      expect(child[key], `Child object field "${key}" mismatch`).to.equal(val);
    }
  },
);

When(
  'I remove child entity {string} from the {string} list',
  function (this: CustomWorld, indexStr: string, relationshipName: string) {
    const base = this.retrievedEntity || this.savedEntity || this.currentEntity;
    const entityObj = typeof base.toJSON === 'function' ? base.toJSON() : { ...base };
    const index = parseInt(indexStr, 10);

    const children = [...(entityObj[relationshipName] || [])];
    const [removedChild] = children.splice(index, 1);
    this.contextData['lastRemovedChild'] = removedChild;
    entityObj[relationshipName] = children;

    this.currentEntity = entityObj;
  },
);

Then(
  'the removed {string} entity should not exist in the database',
  async function (this: CustomWorld, childEntityName: string) {
    const removedChild = this.contextData['lastRemovedChild'];
    expect(removedChild, 'Removed child entity should have been tracked').to.be.ok;
    expect(removedChild.id, 'Removed child entity should have an ID').to.be.ok;

    let thrownError = null;
    try {
      await this.queryService.findOne(childEntityName, removedChild.id);
    } catch (error) {
      thrownError = error;
    }

    expect(
      thrownError,
      `Expected findOne for ${childEntityName} (${removedChild.id}) to fail with DataNotFound`,
    ).to.be.ok;
  },
);

When(
  'I update the entity attributes:',
  function (this: CustomWorld, dataTable: DataTable) {
    const updates = dataTable.rowsHash();
    // Keep the id and existing children intact and apply updates
    const base = this.retrievedEntity || this.savedEntity || this.currentEntity;
    this.currentEntity = {
      ...(typeof base.toJSON === 'function' ? base.toJSON() : base),
      ...updates,
    };
  },
);

Then(
  'the save response should have action {string}',
  function (this: CustomWorld, expectedAction: string) {
    expect(this.lastResponse, 'Last response should exist').to.be.ok;
    expect(this.lastResponse.action).to.equal(expectedAction);
  },
);

Then(
  'the validation results should contain an error for {string}',
  function (this: CustomWorld, fieldName: string) {
    expect(this.lastResponse, 'Last response should exist').to.be.ok;
    const validationResults = this.lastResponse.validationResults;
    expect(validationResults, 'Validation results should exist').to.be.ok;
    expect(validationResults[fieldName], `Expected validation result for ${fieldName}`).to.be.ok;
    expect(validationResults[fieldName].resultType, `Result type for ${fieldName}`).to.equal('Error');
  },
);

When(
  'I destroy the {string} by its ID',
  async function (this: CustomWorld, entityName: string) {
    const targetId = this.savedEntity ? this.savedEntity.id : this.currentEntity?.id;
    if (!targetId) {
      throw new Error('No entity ID available to destroy');
    }

    try {
      await this.dataService.destroy(entityName, targetId);
    } catch (error) {
      this.lastError = error;
    }
  },
);

When(
  'I attempt to destroy the {string} {string}',
  async function (this: CustomWorld, entityName: string, alias: string) {
    const targetEntity = this.contextData[alias];
    if (!targetEntity) {
      throw new Error(`Alias ${alias} not found in scenario context`);
    }

    try {
      await this.dataService.destroy(entityName, targetEntity.id);
    } catch (error) {
      this.lastError = error;
    }
  },
);

Then(
  'querying {string} by its ID should throw DataNotFound',
  async function (this: CustomWorld, entityName: string) {
    const targetId = this.savedEntity ? this.savedEntity.id : this.currentEntity?.id;
    let thrownError = null;
    try {
      await this.queryService.findOne(entityName, targetId);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError, 'Expected findOne to throw DataNotFound').to.be.ok;
  },
);

Then(
  'the destroy operation should fail with related entities error',
  function (this: CustomWorld) {
    expect(this.lastError, 'Expected destroy to throw an error').to.be.ok;
    expect(this.lastError.message).to.include('since there are related entities');
  },
);

When(
  'I move {string} with name {string} {string}',
  async function (this: CustomWorld, entityName: string, name: string, directionStr: string) {
    const all = await this.queryService.findAll(entityName);
    const target = all.resultList.find((e: any) => e.name === name);
    if (!target) {
      throw new Error(`Could not find ${entityName} with name ${name}`);
    }

    const direction = directionStr === 'up' ? -1 : 1;
    const req: UpdateSortIndexRequest = {
      metaName: entityName,
      id: target.id,
      direction: direction,
    };

    await this.dataService.updateSortIndex(req);
  },
);

Then(
  'the list of {string} in sort order should be:',
  async function (this: CustomWorld, entityName: string, dataTable: DataTable) {
    const all = await this.queryService.findAll(entityName);
    const sorted = [...all.resultList].sort(
      (a: any, b: any) => a.sort_index - b.sort_index,
    );

    const expected = dataTable.hashes();
    expect(sorted.length, `Expected ${expected.length} items`).to.equal(expected.length);

    for (let i = 0; i < expected.length; i++) {
      expect(sorted[i].name).to.equal(expected[i].name);
      expect(sorted[i].sort_index).to.equal(parseInt(expected[i].sort_index, 10));
    }
  },
);
