import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../../../../support/world';
import {
  Entity,
  QueryRequest,
  Criteria,
  ComparisonOperator,
  AttributeType,
} from '@perfect-stack/nestjs-server';

Given(
  'the following {string} records exist:',
  async function (this: CustomWorld, entityName: string, dataTable: DataTable) {
    const rows = dataTable.hashes();
    for (const row of rows) {
      await this.dataService.save(entityName, row as unknown as Entity);
    }
  },
);

When(
  'I query {string} by criteria:',
  async function (this: CustomWorld, entityName: string, dataTable: DataTable) {
    const rows = dataTable.hashes();
    const queryRequest = new QueryRequest();
    queryRequest.metaEntityName = entityName;
    queryRequest.criteria = rows.map((row) => {
      const criteria = new Criteria();
      criteria.name = row.name;
      criteria.operator = row.operator as ComparisonOperator;
      criteria.attributeType = row.attributeType as AttributeType;
      criteria.value = row.value;
      return criteria;
    });

    this.queryResponse = await this.queryService.findByCriteria(queryRequest);
  },
);

When(
  'I query {string} ordered by {string} {string} by criteria:',
  async function (
    this: CustomWorld,
    entityName: string,
    orderByName: string,
    orderByDir: string,
    dataTable: DataTable,
  ) {
    const rows = dataTable.hashes();
    const queryRequest = new QueryRequest();
    queryRequest.metaEntityName = entityName;
    queryRequest.orderByName = orderByName;
    queryRequest.orderByDir = orderByDir;
    queryRequest.criteria = rows.map((row) => {
      const criteria = new Criteria();
      criteria.name = row.name;
      criteria.operator = row.operator as ComparisonOperator;
      criteria.attributeType = row.attributeType as AttributeType;
      criteria.value = row.value;
      return criteria;
    });

    this.queryResponse = await this.queryService.findByCriteria(queryRequest);
  },
);

When(
  'I query {string} page {int} of size {int} ordered by {string} {string} by criteria:',
  async function (
    this: CustomWorld,
    entityName: string,
    pageNumber: number,
    pageSize: number,
    orderByName: string,
    orderByDir: string,
    dataTable: DataTable,
  ) {
    const rows = dataTable.hashes();
    const queryRequest = new QueryRequest();
    queryRequest.metaEntityName = entityName;
    queryRequest.pageNumber = pageNumber;
    queryRequest.pageSize = pageSize;
    queryRequest.orderByName = orderByName;
    queryRequest.orderByDir = orderByDir;
    queryRequest.criteria = rows.map((row) => {
      const criteria = new Criteria();
      criteria.name = row.name;
      criteria.operator = row.operator as ComparisonOperator;
      criteria.attributeType = row.attributeType as AttributeType;
      criteria.value = row.value;
      return criteria;
    });

    this.queryResponse = await this.queryService.findByCriteria(queryRequest);
  },
);

Then(
  'the query response should contain {int} records',
  function (this: CustomWorld, expectedCount: number) {
    expect(this.queryResponse, 'Query response should exist').to.be.ok;
    expect(this.queryResponse.resultList, 'Result list should exist').to.be.an('array');
    expect(
      this.queryResponse.resultList.length,
      `Expected ${expectedCount} records in resultList`,
    ).to.equal(expectedCount);
  },
);

Then(
  'the query response total count should be {int}',
  function (this: CustomWorld, expectedTotal: number) {
    expect(this.queryResponse, 'Query response should exist').to.be.ok;
    expect(
      this.queryResponse.totalCount,
      `Expected totalCount to be ${expectedTotal} but got ${this.queryResponse.totalCount}`,
    ).to.equal(expectedTotal);
  },
);

Then(
  'the query response result list should match:',
  function (this: CustomWorld, dataTable: DataTable) {
    expect(this.queryResponse, 'Query response should exist').to.be.ok;
    const actualList = this.queryResponse.resultList;
    const expectedRows = dataTable.hashes();

    expect(
      actualList.length,
      `Expected ${expectedRows.length} items but got ${actualList.length}`,
    ).to.equal(expectedRows.length);

    for (let i = 0; i < expectedRows.length; i++) {
      const expected = expectedRows[i];
      const actual = actualList[i];
      for (const [key, val] of Object.entries(expected)) {
        expect(
          String(actual[key]),
          `Item [${i}] field "${key}" expected "${val}" but got "${actual[key]}"`,
        ).to.equal(val);
      }
    }
  },
);
