import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../../../../support/world';
import { Entity } from '@perfect-stack/nestjs-server';

interface OrgNode {
  name: string;
  code: string;
  unit_type: string;
  parent?: string; // parent name
}

const ORG_NODES: OrgNode[] = [
  // Root
  { name: 'Global Enterprise', code: 'HQ', unit_type: 'Headquarters' },

  // Divisions under Root
  { name: 'Engineering Division', code: 'ENG', unit_type: 'Division', parent: 'Global Enterprise' },
  { name: 'Operations Division', code: 'OPS', unit_type: 'Division', parent: 'Global Enterprise' },
  { name: 'Sales Division', code: 'SALES', unit_type: 'Division', parent: 'Global Enterprise' },

  // Engineering -> Departments
  { name: 'Software Development', code: 'DEV', unit_type: 'Department', parent: 'Engineering Division' },
  { name: 'Infrastructure & Cloud', code: 'INFRA', unit_type: 'Department', parent: 'Engineering Division' },
  { name: 'Quality Assurance', code: 'QA', unit_type: 'Department', parent: 'Engineering Division' },

  // Software Development -> Teams
  { name: 'Frontend Web Team', code: 'DEV-FE', unit_type: 'Team', parent: 'Software Development' },
  { name: 'Backend Platform Team', code: 'DEV-BE', unit_type: 'Team', parent: 'Software Development' },
  { name: 'Mobile Apps Team', code: 'DEV-MOB', unit_type: 'Team', parent: 'Software Development' },

  // Operations -> Departments
  { name: 'Human Resources', code: 'HR', unit_type: 'Department', parent: 'Operations Division' },
  { name: 'Logistics & Supply', code: 'LOG', unit_type: 'Department', parent: 'Operations Division' },
  { name: 'Customer Support', code: 'SUP', unit_type: 'Department', parent: 'Operations Division' },

  // Sales -> Departments
  { name: 'Enterprise Accounts', code: 'SALES-ENT', unit_type: 'Department', parent: 'Sales Division' },
  { name: 'Retail & Direct', code: 'SALES-RET', unit_type: 'Department', parent: 'Sales Division' },
];

Given(
  'a populated organisational {string} tree containing Engineering, Operations, and Sales divisions',
  async function (this: CustomWorld, entityName: string) {
    this.currentEntityName = entityName;
    this.contextData.orgUnitByName = {};

    for (const node of ORG_NODES) {
      let parentId: string | null = null;
      if (node.parent) {
        const parentEntity = this.contextData.orgUnitByName[node.parent];
        if (!parentEntity) {
          throw new Error(`Parent ${node.parent} not found while seeding org tree`);
        }
        parentId = parentEntity.id;
      }

      const entityPayload: any = {
        name: node.name,
        code: node.code,
        unit_type: node.unit_type,
        parent_id: parentId,
      };

      const response = await this.dataService.save(
        entityName,
        entityPayload as unknown as Entity,
      );

      const saved = response.entity;
      this.contextData.orgUnitByName[node.name] = saved;
    }
  },
);

When(
  'I query the tree for {string}',
  async function (this: CustomWorld, entityName: string) {
    this.currentEntityName = entityName;
    this.retrievedEntity = await this.queryService.findTree(entityName);
  },
);

When(
  'I query the subtree for {string} starting at {string} with depth {int}',
  async function (this: CustomWorld, entityName: string, nodeIdentifier: string, depth: number) {
    this.currentEntityName = entityName;
    const targetNode = this.contextData.orgUnitByName[nodeIdentifier];
    if (!targetNode) {
      throw new Error(`OrganisationUnit node ${nodeIdentifier} not found in context`);
    }
    this.retrievedEntity = await this.queryService.findTree(entityName, targetNode.id, depth);
  },
);

When(
  'I query ancestors for {string} with name {string}',
  async function (this: CustomWorld, entityName: string, name: string) {
    this.currentEntityName = entityName;
    const targetNode = this.contextData.orgUnitByName[name];
    if (!targetNode) {
      throw new Error(`OrganisationUnit node ${name} not found in context`);
    }
    this.contextData.ancestors = await this.queryService.findAncestors(entityName, targetNode.id);
  },
);

When(
  'I query children for {string} parent {string} page {int} size {int}',
  async function (
    this: CustomWorld,
    entityName: string,
    parentIdentifier: string,
    pageNumber: number,
    pageSize: number,
  ) {
    this.currentEntityName = entityName;
    const parentNode = this.contextData.orgUnitByName[parentIdentifier];
    if (!parentNode) {
      throw new Error(`OrganisationUnit parent ${parentIdentifier} not found in context`);
    }
    this.contextData.childPage = await this.queryService.findChildren(
      entityName,
      parentNode.id,
      pageNumber,
      pageSize,
    );
  },
);

Then(
  'the root node should have name {string} and unit_type {string}',
  function (this: CustomWorld, name: string, unitType: string) {
    expect(this.retrievedEntity).to.be.ok;
    expect(this.retrievedEntity.name).to.equal(name);
    expect(this.retrievedEntity.unit_type).to.equal(unitType);
  },
);

Then(
  'the root node should have {int} children: {string}, {string}, {string}',
  function (
    this: CustomWorld,
    count: number,
    c1: string,
    c2: string,
    c3: string,
  ) {
    expect(this.retrievedEntity.children).to.be.an('array').with.lengthOf(count);
    const names = this.retrievedEntity.children.map((c: any) => c.name);
    expect(names).to.include.members([c1, c2, c3]);
  },
);

Then(
  'the subtree root should have name {string} and unit_type {string}',
  function (this: CustomWorld, name: string, unitType: string) {
    expect(this.retrievedEntity).to.be.ok;
    expect(this.retrievedEntity.name).to.equal(name);
    expect(this.retrievedEntity.unit_type).to.equal(unitType);
  },
);

Then(
  'the subtree root should have {int} children: {string}, {string}, {string}',
  function (
    this: CustomWorld,
    count: number,
    c1: string,
    c2: string,
    c3: string,
  ) {
    expect(this.retrievedEntity.children).to.be.an('array').with.lengthOf(count);
    const names = this.retrievedEntity.children.map((c: any) => c.name);
    expect(names).to.include.members([c1, c2, c3]);
  },
);

Then(
  'the child {string} should have {int} nested children loaded',
  function (this: CustomWorld, childName: string, count: number) {
    const child = this.retrievedEntity.children.find((c: any) => c.name === childName);
    expect(child).to.be.ok;
    expect(child.children || []).to.have.lengthOf(count);
  },
);

Then(
  'the ancestor chain from root to leaf should be:',
  function (this: CustomWorld, dataTable: DataTable) {
    const expectedRows = dataTable.hashes();
    const ancestors = this.contextData.ancestors;
    expect(ancestors).to.be.an('array').with.lengthOf(expectedRows.length);

    for (let i = 0; i < expectedRows.length; i++) {
      expect(ancestors[i].name).to.equal(expectedRows[i].name);
      expect(ancestors[i].unit_type).to.equal(expectedRows[i].unit_type);
    }
  },
);

Then(
  'the child page should contain {int} items with totalCount {int}',
  function (this: CustomWorld, itemCount: number, totalCount: number) {
    const childPage = this.contextData.childPage;
    expect(childPage).to.be.ok;
    expect(childPage.resultList).to.be.an('array').with.lengthOf(itemCount);
    expect(childPage.totalCount).to.equal(totalCount);
  },
);

When(
  'I update {string} node {string} attribute {string} to {string}',
  async function (
    this: CustomWorld,
    entityName: string,
    nodeIdentifier: string,
    attributeName: string,
    newValue: string,
  ) {
    const targetNode = this.contextData.orgUnitByName[nodeIdentifier];
    if (!targetNode) {
      throw new Error(`OrganisationUnit node ${nodeIdentifier} not found`);
    }

    const payload: any = {
      id: targetNode.id,
      name: targetNode.name,
      code: targetNode.code,
      unit_type: targetNode.unit_type,
      parent_id: targetNode.parent_id,
      [attributeName]: newValue,
    };

    const response = await this.dataService.save(entityName, payload as Entity);
    this.contextData.updatedNode = response.entity;
    this.contextData.orgUnitByName[nodeIdentifier] = response.entity;
  },
);

Then(
  'the node {string} attribute {string} should be {string}',
  async function (
    this: CustomWorld,
    nodeIdentifier: string,
    attributeName: string,
    expectedValue: string,
  ) {
    const node = this.contextData.orgUnitByName[nodeIdentifier];
    const reloaded = await this.queryService.findOne('OrganisationUnit', node.id);
    expect(reloaded[attributeName]).to.equal(expectedValue);
  },
);

Then(
  'the child nodes under {string} should remain intact',
  async function (this: CustomWorld, nodeIdentifier: string) {
    const node = this.contextData.orgUnitByName[nodeIdentifier];
    const childrenResponse = await this.queryService.findChildren('OrganisationUnit', node.id);
    expect(childrenResponse.totalCount).to.be.greaterThan(0);
  },
);

When(
  'I attempt to create a second root {string} entity with name {string} and unit_type {string}',
  async function (this: CustomWorld, entityName: string, name: string, unitType: string) {
    try {
      this.lastError = null;
      await this.dataService.save(entityName, {
        name: name,
        code: 'ALT-ROOT',
        unit_type: unitType,
        parent_id: null,
      } as unknown as Entity);
    } catch (err) {
      this.lastError = err;
    }
  },
);

When(
  'I attempt to create a {string} entity with name {string} and non-existent parent',
  async function (this: CustomWorld, entityName: string, name: string) {
    try {
      this.lastError = null;
      await this.dataService.save(entityName, {
        name: name,
        code: 'ORPHAN',
        unit_type: 'Team',
        parent_id: '00000000-0000-0000-0000-000000000000',
      } as unknown as Entity);
    } catch (err) {
      this.lastError = err;
    }
  },
);

When(
  'I reparent {string} node {string} to {string}',
  async function (
    this: CustomWorld,
    entityName: string,
    nodeIdentifier: string,
    newParentIdentifier: string,
  ) {
    const node = this.contextData.orgUnitByName[nodeIdentifier];
    const newParent = this.contextData.orgUnitByName[newParentIdentifier];
    if (!node || !newParent) {
      throw new Error(`Node ${nodeIdentifier} or new parent ${newParentIdentifier} not found`);
    }

    const payload: any = {
      id: node.id,
      name: node.name,
      code: node.code,
      unit_type: node.unit_type,
      parent_id: newParent.id,
    };

    const response = await this.dataService.save(entityName, payload as Entity);
    this.contextData.orgUnitByName[nodeIdentifier] = response.entity;
  },
);

Then(
  'the node {string} parent should be {string}',
  async function (this: CustomWorld, nodeIdentifier: string, parentIdentifier: string) {
    const node = this.contextData.orgUnitByName[nodeIdentifier];
    const parent = this.contextData.orgUnitByName[parentIdentifier];
    const reloaded = await this.queryService.findOne('OrganisationUnit', node.id);
    expect(reloaded.parent_id).to.equal(parent.id);
  },
);

When(
  'I attempt to reparent {string} node {string} to its descendant {string}',
  async function (
    this: CustomWorld,
    entityName: string,
    ancestorIdentifier: string,
    descendantIdentifier: string,
  ) {
    const ancestor = this.contextData.orgUnitByName[ancestorIdentifier];
    const descendant = this.contextData.orgUnitByName[descendantIdentifier];

    try {
      this.lastError = null;
      const payload: any = {
        id: ancestor.id,
        name: ancestor.name,
        code: ancestor.code,
        unit_type: ancestor.unit_type,
        parent_id: descendant.id,
      };
      await this.dataService.save(entityName, payload as Entity);
    } catch (err) {
      this.lastError = err;
    }
  },
);

When(
  'I attempt to delete {string} node {string}',
  async function (this: CustomWorld, entityName: string, nodeIdentifier: string) {
    const node = this.contextData.orgUnitByName[nodeIdentifier];
    try {
      this.lastError = null;
      await this.dataService.destroy(entityName, node.id);
    } catch (err) {
      this.lastError = err;
    }
  },
);

When(
  'I delete leaf {string} node {string}',
  async function (this: CustomWorld, entityName: string, nodeIdentifier: string) {
    const node = this.contextData.orgUnitByName[nodeIdentifier];
    await this.dataService.destroy(entityName, node.id);
    delete this.contextData.orgUnitByName[nodeIdentifier];
  },
);

Then(
  'the node {string} should no longer exist',
  async function (this: CustomWorld, nodeIdentifier: string) {
    const entity = this.contextData.orgUnitByName[nodeIdentifier];
    let found = false;
    try {
      if (entity) {
        await this.queryService.findOne('OrganisationUnit', entity.id);
        found = true;
      }
    } catch (err) {
      found = false;
    }
    expect(found).to.be.false;
  },
);

Then(
  'the save operation should fail with an error containing {string}',
  function (this: CustomWorld, errorSubstring: string) {
    expect(this.lastError, 'Expected an error to have been thrown').to.be.ok;
    expect(this.lastError.message).to.include(errorSubstring);
  },
);

Then(
  'the delete operation should fail with an error containing {string}',
  function (this: CustomWorld, errorSubstring: string) {
    expect(this.lastError, 'Expected an error to have been thrown').to.be.ok;
    expect(this.lastError.message).to.include(errorSubstring);
  },
);
