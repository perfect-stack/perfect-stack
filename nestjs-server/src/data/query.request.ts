import { ComparisonOperator } from '../domain/meta.entity';

export class Criteria {
  name: string;
  operator: ComparisonOperator;
  value: string;
}

export class QueryRequest {
  metaEntityName: string;
  criteria: Criteria[] = [];
  orderByName: string;
  orderByDir: string;
  pageNumber = 1;
  pageSize = 50;
}
