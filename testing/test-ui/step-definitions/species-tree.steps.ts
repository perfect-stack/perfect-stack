import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from 'chai';
import { UIWorld } from '../support/world';
import * as http from 'http';

function makeApiRequest(
  method: string,
  path: string,
  body?: any,
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3080,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {}
          resolve({ statusCode: res.statusCode || 200, data: parsed });
        });
      },
    );
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

interface TaxonNode {
  scientific_name: string;
  common_name?: string;
  rank: string;
  parent?: string; // parent scientific_name
}

const TAXON_NODES: TaxonNode[] = [
  // Kingdom (Root)
  { scientific_name: 'Animalia', common_name: 'Animals', rank: 'Kingdom' },

  // Phylum
  { scientific_name: 'Chordata', common_name: 'Chordates', rank: 'Phylum', parent: 'Animalia' },

  // Classes
  { scientific_name: 'Mammalia', common_name: 'Mammals', rank: 'Class', parent: 'Chordata' },
  { scientific_name: 'Aves', common_name: 'Birds', rank: 'Class', parent: 'Chordata' },
  { scientific_name: 'Actinopterygii', common_name: 'Ray-finned Fishes', rank: 'Class', parent: 'Chordata' },

  // Mammals -> Carnivora
  { scientific_name: 'Carnivora', common_name: 'Carnivorans', rank: 'Order', parent: 'Mammalia' },
  { scientific_name: 'Canidae', common_name: 'Canines', rank: 'Family', parent: 'Carnivora' },
  { scientific_name: 'Canis', common_name: 'Dogs', rank: 'Genus', parent: 'Canidae' },
  { scientific_name: 'Canis familiaris', common_name: 'Domestic Dog', rank: 'Species', parent: 'Canis' },

  { scientific_name: 'Felidae', common_name: 'Cats', rank: 'Family', parent: 'Carnivora' },
  { scientific_name: 'Felis', common_name: 'Small Cats', rank: 'Genus', parent: 'Felidae' },
  { scientific_name: 'Felis catus', common_name: 'Domestic Cat', rank: 'Species', parent: 'Felis' },

  // Birds:
  // 1. Budgerigar (Melopsittacus undulatus) - Psittaciformes -> Psittaculidae -> Melopsittacus
  // 2. Cockatiel (Nymphicus hollandicus) - Psittaciformes -> Cacatuidae -> Nymphicus
  { scientific_name: 'Psittaciformes', common_name: 'Parrots', rank: 'Order', parent: 'Aves' },
  { scientific_name: 'Psittaculidae', common_name: 'Old World Parrots', rank: 'Family', parent: 'Psittaciformes' },
  { scientific_name: 'Melopsittacus', rank: 'Genus', parent: 'Psittaculidae' },
  { scientific_name: 'Melopsittacus undulatus', common_name: 'Budgerigar', rank: 'Species', parent: 'Melopsittacus' },

  { scientific_name: 'Cacatuidae', common_name: 'Cockatoos', rank: 'Family', parent: 'Psittaciformes' },
  { scientific_name: 'Nymphicus', rank: 'Genus', parent: 'Cacatuidae' },
  { scientific_name: 'Nymphicus hollandicus', common_name: 'Cockatiel', rank: 'Species', parent: 'Nymphicus' },

  // 3. Atlantic Canary (Serinus canaria) - Passeriformes -> Fringillidae -> Serinus
  { scientific_name: 'Passeriformes', common_name: 'Perching Birds', rank: 'Order', parent: 'Aves' },
  { scientific_name: 'Fringillidae', common_name: 'Finches', rank: 'Family', parent: 'Passeriformes' },
  { scientific_name: 'Serinus', common_name: 'Canaries', rank: 'Genus', parent: 'Fringillidae' },
  { scientific_name: 'Serinus canaria', common_name: 'Atlantic Canary', rank: 'Species', parent: 'Serinus' },

  // Fish:
  // 1. Goldfish (Carassius auratus) - Cypriniformes -> Cyprinidae -> Carassius
  { scientific_name: 'Cypriniformes', common_name: 'Carps and Minnows', rank: 'Order', parent: 'Actinopterygii' },
  { scientific_name: 'Cyprinidae', common_name: 'Carp Family', rank: 'Family', parent: 'Cypriniformes' },
  { scientific_name: 'Carassius', rank: 'Genus', parent: 'Cyprinidae' },
  { scientific_name: 'Carassius auratus', common_name: 'Goldfish', rank: 'Species', parent: 'Carassius' },

  // 2. Siamese Fighting Fish (Betta splendens) - Anabantiformes -> Osphronemidae -> Betta
  { scientific_name: 'Anabantiformes', common_name: 'Labyrinth Fishes', rank: 'Order', parent: 'Actinopterygii' },
  { scientific_name: 'Osphronemidae', common_name: 'Gouramis', rank: 'Family', parent: 'Anabantiformes' },
  { scientific_name: 'Betta', rank: 'Genus', parent: 'Osphronemidae' },
  { scientific_name: 'Betta splendens', common_name: 'Siamese Fighting Fish', rank: 'Species', parent: 'Betta' },

  // 3. Guppy (Poecilia reticulata) - Cyprinodontiformes -> Poeciliidae -> Poecilia
  { scientific_name: 'Cyprinodontiformes', common_name: 'Toothcarps', rank: 'Order', parent: 'Actinopterygii' },
  { scientific_name: 'Poeciliidae', common_name: 'Livebearers', rank: 'Family', parent: 'Cyprinodontiformes' },
  { scientific_name: 'Poecilia', rank: 'Genus', parent: 'Poeciliidae' },
  { scientific_name: 'Poecilia reticulata', common_name: 'Guppy', rank: 'Species', parent: 'Poecilia' },
];

async function cleanupTaxonTree(): Promise<void> {
  // First clear pets that reference species
  const petsResp = await makeApiRequest('GET', '/data/Pet');
  const pets = petsResp.data?.resultList || petsResp.data || [];
  if (Array.isArray(pets)) {
    for (const pet of pets) {
      await makeApiRequest('DELETE', `/data/Pet/${pet.id}`);
    }
  }

  // Delete species from leaves upwards
  for (let round = 0; round < 10; round++) {
    const resp = await makeApiRequest('GET', '/data/Species');
    const speciesList = resp.data?.resultList || resp.data || [];
    if (!Array.isArray(speciesList) || speciesList.length === 0) break;

    for (const s of speciesList) {
      await makeApiRequest('DELETE', `/data/Species/${s.id}`);
    }
  }
}

Given(
  'a populated taxonomic {string} tree containing Mammals, Birds, and Fish',
  async function (this: UIWorld, entityName: string) {
    this.contextData.speciesByName = {};

    await cleanupTaxonTree();

    for (const node of TAXON_NODES) {
      let parentId: string | null = null;
      if (node.parent) {
        const parentEntity = this.contextData.speciesByName[node.parent];
        if (!parentEntity) {
          throw new Error(`Parent ${node.parent} not found while seeding species tree`);
        }
        parentId = parentEntity.id;
      }

      const entityPayload: any = {
        scientific_name: node.scientific_name,
        common_name: node.common_name,
        rank: node.rank,
        parent_id: parentId,
      };

      const res = await makeApiRequest('POST', `/data/${entityName}`, entityPayload);
      if (res.statusCode >= 400 || !res.data?.entity) {
        throw new Error(`Failed to save taxon ${node.scientific_name}: ${JSON.stringify(res.data)}`);
      }
      this.contextData.speciesByName[node.scientific_name] = res.data.entity;
    }
  },
);

When(
  'I query the tree for {string}',
  async function (this: UIWorld, entityName: string) {
    const res = await makeApiRequest('GET', `/data/${entityName}/tree`);
    this.retrievedEntity = res.data;
  },
);

When(
  'I query the subtree for {string} starting at {string} with depth {int}',
  async function (this: UIWorld, entityName: string, nodeIdentifier: string, depth: number) {
    const targetNode = this.contextData.speciesByName[nodeIdentifier];
    if (!targetNode) {
      throw new Error(`Taxon node ${nodeIdentifier} not found in context`);
    }
    const res = await makeApiRequest('GET', `/data/${entityName}/${targetNode.id}/tree?depth=${depth}`);
    this.retrievedEntity = res.data;
  },
);

When(
  'I query ancestors for {string} with scientific name {string}',
  async function (this: UIWorld, entityName: string, scientificName: string) {
    const targetNode = this.contextData.speciesByName[scientificName];
    if (!targetNode) {
      throw new Error(`Taxon node ${scientificName} not found in context`);
    }
    const res = await makeApiRequest('GET', `/data/${entityName}/${targetNode.id}/ancestors`);
    this.contextData.ancestors = res.data;
  },
);

When(
  'I query children for {string} parent {string} page {int} size {int}',
  async function (
    this: UIWorld,
    entityName: string,
    parentIdentifier: string,
    pageNumber: number,
    pageSize: number,
  ) {
    const parentNode = this.contextData.speciesByName[parentIdentifier];
    if (!parentNode) {
      throw new Error(`Taxon parent ${parentIdentifier} not found in context`);
    }
    const res = await makeApiRequest(
      'GET',
      `/data/${entityName}/${parentNode.id}/children?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    );
    this.contextData.childPage = res.data;
  },
);

Then(
  'the root node should have scientific_name {string} and rank {string}',
  function (this: UIWorld, scientificName: string, rank: string) {
    expect(this.retrievedEntity).to.be.ok;
    expect(this.retrievedEntity.scientific_name).to.equal(scientificName);
    expect(this.retrievedEntity.rank).to.equal(rank);
  },
);

Then(
  'the root node should have {int} children: {string}',
  function (this: UIWorld, count: number, child1: string) {
    expect(this.retrievedEntity.children).to.be.an('array').with.lengthOf(count);
    const names = this.retrievedEntity.children.map((c: any) => c.scientific_name);
    expect(names).to.include(child1);
  },
);

Then(
  'the subtree root should have scientific_name {string} and rank {string}',
  function (this: UIWorld, scientificName: string, rank: string) {
    expect(this.retrievedEntity).to.be.ok;
    expect(this.retrievedEntity.scientific_name).to.equal(scientificName);
    expect(this.retrievedEntity.rank).to.equal(rank);
  },
);

Then(
  'the subtree root should have {int} children: {string}, {string}, {string}',
  function (
    this: UIWorld,
    count: number,
    c1: string,
    c2: string,
    c3: string,
  ) {
    expect(this.retrievedEntity.children).to.be.an('array').with.lengthOf(count);
    const names = this.retrievedEntity.children.map((c: any) => c.scientific_name);
    expect(names).to.include.members([c1, c2, c3]);
  },
);

Then(
  'the child {string} should have {int} nested children loaded',
  function (this: UIWorld, childName: string, count: number) {
    const child = this.retrievedEntity.children.find((c: any) => c.scientific_name === childName);
    expect(child).to.be.ok;
    expect(child.children || []).to.have.lengthOf(count);
  },
);

Then(
  'the ancestor chain from root to leaf should be:',
  function (this: UIWorld, dataTable: DataTable) {
    const expectedRows = dataTable.hashes();
    const ancestors = this.contextData.ancestors;
    expect(ancestors).to.be.an('array').with.lengthOf(expectedRows.length);

    for (let i = 0; i < expectedRows.length; i++) {
      expect(ancestors[i].scientific_name).to.equal(expectedRows[i].scientific_name);
      expect(ancestors[i].rank).to.equal(expectedRows[i].rank);
    }
  },
);

Then(
  'the child page should contain {int} items with totalCount {int}',
  function (this: UIWorld, itemCount: number, totalCount: number) {
    const childPage = this.contextData.childPage;
    expect(childPage).to.be.ok;
    expect(childPage.resultList).to.be.an('array').with.lengthOf(itemCount);
    expect(childPage.totalCount).to.equal(totalCount);
  },
);

When(
  'I update {string} node {string} attribute {string} to {string}',
  async function (
    this: UIWorld,
    entityName: string,
    nodeIdentifier: string,
    attributeName: string,
    newValue: string,
  ) {
    const targetNode = this.contextData.speciesByName[nodeIdentifier];
    if (!targetNode) {
      throw new Error(`Taxon node ${nodeIdentifier} not found`);
    }

    const payload: any = {
      id: targetNode.id,
      scientific_name: targetNode.scientific_name,
      common_name: targetNode.common_name,
      rank: targetNode.rank,
      parent_id: targetNode.parent_id,
      [attributeName]: newValue,
    };

    const res = await makeApiRequest('POST', `/data/${entityName}`, payload);
    expect(res.statusCode).to.be.lessThan(400);
    this.contextData.speciesByName[nodeIdentifier] = res.data.entity;
  },
);

Then(
  'the node {string} attribute {string} should be {string}',
  async function (
    this: UIWorld,
    nodeIdentifier: string,
    attributeName: string,
    expectedValue: string,
  ) {
    const node = this.contextData.speciesByName[nodeIdentifier];
    const res = await makeApiRequest('GET', `/data/Species/${node.id}`);
    expect(res.data[attributeName]).to.equal(expectedValue);
  },
);

Then(
  'the child nodes under {string} should remain intact',
  async function (this: UIWorld, nodeIdentifier: string) {
    const node = this.contextData.speciesByName[nodeIdentifier];
    const res = await makeApiRequest('GET', `/data/Species/${node.id}/children`);
    expect(res.data.totalCount).to.be.greaterThan(0);
  },
);

When(
  'I attempt to create a second root {string} entity with scientific_name {string} and rank {string}',
  async function (this: UIWorld, entityName: string, name: string, rank: string) {
    this.lastError = null;
    const res = await makeApiRequest('POST', `/data/${entityName}`, {
      scientific_name: name,
      rank: rank,
      parent_id: null,
    });
    if (res.statusCode >= 400 || res.data?.error) {
      this.lastError = res.data?.message || res.data?.error || JSON.stringify(res.data);
    }
  },
);

When(
  'I attempt to create a {string} entity with scientific_name {string} and non-existent parent',
  async function (this: UIWorld, entityName: string, name: string) {
    this.lastError = null;
    const res = await makeApiRequest('POST', `/data/${entityName}`, {
      scientific_name: name,
      rank: 'Species',
      parent_id: '00000000-0000-0000-0000-000000000000',
    });
    if (res.statusCode >= 400 || res.data?.error) {
      this.lastError = res.data?.message || res.data?.error || JSON.stringify(res.data);
    }
  },
);

When(
  'I reparent {string} node {string} to {string}',
  async function (
    this: UIWorld,
    entityName: string,
    nodeIdentifier: string,
    newParentIdentifier: string,
  ) {
    const node = this.contextData.speciesByName[nodeIdentifier];
    const newParent = this.contextData.speciesByName[newParentIdentifier];
    if (!node || !newParent) {
      throw new Error(`Node ${nodeIdentifier} or new parent ${newParentIdentifier} not found`);
    }

    const payload: any = {
      id: node.id,
      scientific_name: node.scientific_name,
      common_name: node.common_name,
      rank: node.rank,
      parent_id: newParent.id,
    };

    const res = await makeApiRequest('POST', `/data/${entityName}`, payload);
    expect(res.statusCode).to.be.lessThan(400);
    this.contextData.speciesByName[nodeIdentifier] = res.data.entity;
  },
);

Then(
  'the node {string} parent should be {string}',
  async function (this: UIWorld, nodeIdentifier: string, parentIdentifier: string) {
    const node = this.contextData.speciesByName[nodeIdentifier];
    const parent = this.contextData.speciesByName[parentIdentifier];
    const res = await makeApiRequest('GET', `/data/Species/${node.id}`);
    expect(res.data.parent_id).to.equal(parent.id);
  },
);

When(
  'I attempt to reparent {string} node {string} to its descendant {string}',
  async function (
    this: UIWorld,
    entityName: string,
    ancestorIdentifier: string,
    descendantIdentifier: string,
  ) {
    const ancestor = this.contextData.speciesByName[ancestorIdentifier];
    const descendant = this.contextData.speciesByName[descendantIdentifier];

    this.lastError = null;
    const payload: any = {
      id: ancestor.id,
      scientific_name: ancestor.scientific_name,
      common_name: ancestor.common_name,
      rank: ancestor.rank,
      parent_id: descendant.id,
    };
    const res = await makeApiRequest('POST', `/data/${entityName}`, payload);
    if (res.statusCode >= 400 || res.data?.error) {
      this.lastError = res.data?.message || res.data?.error || JSON.stringify(res.data);
    }
  },
);

When(
  'I attempt to delete {string} node {string}',
  async function (this: UIWorld, entityName: string, nodeIdentifier: string) {
    const node = this.contextData.speciesByName[nodeIdentifier];
    this.lastError = null;
    const res = await makeApiRequest('DELETE', `/data/${entityName}/${node.id}`);
    if (res.statusCode >= 400 || res.data?.error) {
      this.lastError = res.data?.message || res.data?.error || JSON.stringify(res.data);
    }
  },
);

When(
  'I delete leaf {string} node {string}',
  async function (this: UIWorld, entityName: string, nodeIdentifier: string) {
    const node = this.contextData.speciesByName[nodeIdentifier];
    const res = await makeApiRequest('DELETE', `/data/${entityName}/${node.id}`);
    expect(res.statusCode).to.be.lessThan(400);
    delete this.contextData.speciesByName[nodeIdentifier];
  },
);

Then(
  'the node {string} should no longer exist',
  async function (this: UIWorld, nodeIdentifier: string) {
    const entity = this.contextData.speciesByName[nodeIdentifier];
    if (entity) {
      const res = await makeApiRequest('GET', `/data/Species/${entity.id}`);
      expect(res.statusCode).to.be.at.least(400);
    }
  },
);

Then(
  'the save operation should fail with an error containing {string}',
  function (this: UIWorld, errorSubstring: string) {
    expect(this.lastError, 'Expected an error to have occurred').to.be.ok;
    const msg = typeof this.lastError === 'string' ? this.lastError : this.lastError?.message || JSON.stringify(this.lastError);
    expect(msg).to.include(errorSubstring);
  },
);

Then(
  'the delete operation should fail with an error containing {string}',
  function (this: UIWorld, errorSubstring: string) {
    expect(this.lastError, 'Expected an error to have occurred').to.be.ok;
    const msg = typeof this.lastError === 'string' ? this.lastError : this.lastError?.message || JSON.stringify(this.lastError);
    expect(msg).to.include(errorSubstring);
  },
);
