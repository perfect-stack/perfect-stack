import { AuditAction } from '../audit';

export class EntityResponse {
  action: AuditAction;
  entity: any;
}
