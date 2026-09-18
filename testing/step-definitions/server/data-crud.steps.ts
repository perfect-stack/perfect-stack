import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../../support/world';
import { Entity } from '@perfect-stack/nestjs-server';

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
