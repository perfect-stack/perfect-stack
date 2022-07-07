import { AttributeType, ComparisonOperator } from '../domain/meta.entity';

export class Criteria {
  name: string;
  operator: ComparisonOperator;
  attributeType: AttributeType;
  value: string;
}

export class QueryRequest {
  metaEntityName: string;
  criteria: Criteria[] = [];
  customQuery?: string;
  orderByName: string;
  orderByDir: string;
  pageNumber = 1;
  pageSize = 50;
}
