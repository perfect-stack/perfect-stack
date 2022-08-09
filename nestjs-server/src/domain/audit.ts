export interface Audit {
  id: string;
  date_time: string;
  action: AuditAction;
  meta_entity: string;
  entity_id: string;
  person_name: string;
  person_id: string;
  duration: number;
}

export enum AuditAction {
  Create = 'Create',
  Update = 'Update',
  Archive = 'Archive',
  Delete = 'Delete',
}
