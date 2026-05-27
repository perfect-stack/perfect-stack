import { ApiProperty } from '@nestjs/swagger';

export class QueryResponse<T> {
  @ApiProperty({
    description: 'The list of entity results',
    type: 'array',
    items: { type: 'object' },
  })
  resultList: T[];

  @ApiProperty({
    description: 'The total count of results matching the query',
  })
  totalCount: number;
}
