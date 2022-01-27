export enum AttributeType {
  Text = 'Text',
  Number = 'Number',
  Identifier = 'Identifier',
  Date = 'Date',
  OneToMany = 'OneToMany',
  OneToOne = 'OneToOne',
  ManyToOne = 'ManyToOne',
}

export enum ComparisonOperator {
  Equals = 'Equals',
  StartsWith = 'StartsWith',
  Includes = 'Includes',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
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
  comparisonOperator: ComparisonOperator; // Only used by Criteria objects
  relationshipTarget: string;
}

export enum EntityType {
  Basic = 'Basic',
  Criteria = 'Criteria',
  Database = 'Database',
}

export class MetaEntity {
  name: string;
  type: EntityType;
  attributes: MetaAttribute[];
}