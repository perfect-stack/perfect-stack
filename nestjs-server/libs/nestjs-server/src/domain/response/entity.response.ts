import { AuditAction } from '../audit';
import { ValidationResultMap } from '../meta.rule';

export class EntityResponse {
  action: AuditAction;
  entity: any;
  validationResults: ValidationResultMap;
}
