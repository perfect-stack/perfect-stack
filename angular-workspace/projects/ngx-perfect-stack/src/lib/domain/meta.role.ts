

export enum ActionType {
  Any = 'Any',
  Read = 'Read',
  Edit = 'Edit',
  Archive = 'Archive',
  Delete = 'Delete',
  Menu = 'Menu'
}

export class Permission {
  action: ActionType;
  subject: string;
}

export class MetaRole {
  name: string; // user-friendly name that we use in the application
  group: string; // standards compliant name defined by the security/operations team
  description: string; // html field for notes about what the role should be doing
  inherits: string; // names of the MetaRoles that this MetaRole will inherit from, circular definitions will cause an error
  permissions: Permission[];
}
