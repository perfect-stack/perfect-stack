import { AttributeType, ComparisonOperator } from '../domain/meta.entity';
import { ApiProperty } from '@nestjs/swagger';

export class Criteria {
  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ComparisonOperator })
  operator: ComparisonOperator;

  @ApiProperty({ enum: AttributeType })
  attributeType: AttributeType;

  @ApiProperty()
  value: string;
}

export class QueryRequest {
  @ApiProperty()
  metaEntityName: string;

  @ApiProperty({ type: [Criteria] })
  criteria: Criteria[] = [];

  @ApiProperty()
  customQuery?: string;

  @ApiProperty()
  orderByName: string;

  @ApiProperty()
  orderByDir: string;

  @ApiProperty({ type: Number })
  pageNumber = 1;

  @ApiProperty({ type: Number })
  pageSize = 50;
}
