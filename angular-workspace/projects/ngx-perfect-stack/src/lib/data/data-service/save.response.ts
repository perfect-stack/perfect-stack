import {AuditAction} from '../../domain/audit';
import {ValidationResultMap} from '../../domain/meta.rule';

export class SaveResponse {
  action: AuditAction;
  entity: any;
  validationResults: ValidationResultMap;
}
