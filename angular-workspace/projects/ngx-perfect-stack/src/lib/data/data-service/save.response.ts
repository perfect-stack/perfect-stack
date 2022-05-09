import {AuditAction} from '../../domain/audit';

export class SaveResponse {
  action: AuditAction;
  entity: any;
}
