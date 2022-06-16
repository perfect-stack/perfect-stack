export enum AttributeType {
  Text = 'Text',
  Html = 'Html',
  Number = 'Number',
  Integer = 'Integer',
  Identifier = 'Identifier',
  Date = 'Date',
  DateTime = 'DateTime',
  Enumeration = 'Enumeration',
  OneToMany = 'OneToMany',
  OneToOne = 'OneToOne',
  ManyToOne = 'ManyToOne',
  OneToPoly = 'OneToPoly',
}

export enum ComparisonOperator {
  Equals = 'Equals',
  StartsWith = 'StartsWith',
  InsensitiveStartsWith = 'InsensitiveStartsWith',
  InsensitiveLike = 'InsensitiveLike',
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
  // List of the enumerated values (if attribute type === enumeration)
  enumeration: string[];

  static isMetaAttribute(something: any) {
    return something.type && Object.values(AttributeType).indexOf(something.type) >= 0;
  }
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
  pluralName: string;
  type: EntityType;
  icon: string; // icon name for this MetaEntity
  timestamps: boolean; // Controls if Sequelize will add createdAt and updatedAt timestamps to each record (if undefined defaults to true)
  attributes: MetaAttribute[];
}
