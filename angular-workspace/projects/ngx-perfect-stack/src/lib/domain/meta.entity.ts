export enum AttributeType {
  Text = 'Text',
  Html = 'Html',
  Number = 'Number',
  Integer = 'Integer',
  Identifier = 'Identifier',
  Date = 'Date',
  OneToMany = 'OneToMany',
  OneToOne = 'OneToOne',
  ManyToOne = 'ManyToOne',
  OneToPoly = 'OneToPoly',
}

export enum ComparisonOperator {
  Equals = 'Equals',
  StartsWith = 'StartsWith',
  Includes = 'Includes',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
}

export enum VisibilityType {
  Hidden = 'Hidden',
  Visible = 'Visible',
  Optional = 'Optional',
  Required = 'Required',
}

export class MetaAttribute {
  name: string;
  label: string;
  description: string;
  type = AttributeType.Text;
  visibility = VisibilityType.Visible;
  comparisonOperator: ComparisonOperator; // Only used by Criteria objects
  relationshipTarget: string;
  // List of attribute names in the relationshipTarget entity used for Typeahead components
  typeaheadSearch: string[];
  discriminator: DiscriminatorAttribute;
}

export class DiscriminatorAttribute {
  discriminatorName: string;
  discriminatorType: string;
  entityMappingList: DiscriminatorEntityMapping[] = [];
}

export class DiscriminatorEntityMapping {
  discriminatorValue: string;
  metaEntityName: string;
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
