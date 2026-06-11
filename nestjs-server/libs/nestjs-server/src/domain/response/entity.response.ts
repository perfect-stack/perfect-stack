import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../audit';
import { ValidationResultMap } from '../meta.rule';

export class EntityResponse {
  @ApiProperty({ enum: AuditAction, description: 'The audit action that was performed' })
  action: AuditAction;

  @ApiProperty({ type: Object, description: 'The resulting entity data' })
  entity: any;

  @ApiProperty({ type: Object, description: 'Validation results associated with the entity' })
  validationResults: ValidationResultMap;
}
