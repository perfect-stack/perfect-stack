export enum AttributeType {
  Text = 'Text',
  Number = 'Number',
  Identifier = 'Identifier',
  Date = 'Date',
}

export enum VisibilityType {
  Visible = 'Visible',
  Hidden = 'Hidden',
}

export class MetaAttribute {
  name: string;
  label: string;
  description: string;
  type = AttributeType.Text;
  visibility = VisibilityType.Visible;
}

export enum EntityType {
  Database = 'Database',
  Basic = 'Basic',
}

export class MetaEntity {
  name: string;
  type: EntityType;
  attributes: MetaAttribute[];
}
