import { RuleData } from './meta.rule';

export enum AttributeType {
  Text = 'Text',
  Html = 'Html',
  Boolean = 'Boolean',
  Double = 'Double',
  Integer = 'Integer',
  Identifier = 'Identifier',
  Date = 'Date',
  DateTime = 'DateTime',
  Time = 'Time',
  Enumeration = 'Enumeration',
  ManyToOne = 'ManyToOne',
  OneToMany = 'OneToMany',
  OneToOne = 'OneToOne',
  OneToPoly = 'OneToPoly',
  SelectMultiple = 'SelectMultiple',
}

export enum ComparisonOperator {
  Equals = 'Equals',
  StartsWith = 'StartsWith',
  InsensitiveStartsWith = 'InsensitiveStartsWith',
  InsensitiveLike = 'InsensitiveLike',
  Includes = 'Includes', // in subset of OneToPoly association
  GreaterThan = 'GreaterThan',
  GreaterThanOrEqualTo = 'GreaterThanOrEqualTo',
  LessThan = 'LessThan',
  LessThanOrEqualTo = 'LessThanOrEqualTo',
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
  comparisonField: string;
  comparisonOperator: ComparisonOperator; // Only used by Criteria objects
  relationshipTarget: string;
  // List of attribute names in the relationshipTarget entity used for Typeahead components
  typeaheadSearch: string[];
  discriminator: DiscriminatorAttribute;
  // List of the enumerated values (if attribute type === enumeration)
  enumeration: string[];
  unitOfMeasure: string;
  scale: string;

  rules: RuleData[];

  static isMetaAttribute(something: any) {
    return (
      something.type &&
      Object.values(AttributeType).indexOf(something.type) >= 0
    );
  }
}

export class DiscriminatorAttribute {
  discriminatorId?: string;
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
  rootNode: boolean;
  timestamps: boolean; // Controls if Sequelize will add createdAt and updatedAt timestamps to each record (if undefined defaults to true)
  cacheExpiryInSecs: number; // How long to cache instances of this entity on the client in seconds (no value means don't cache)
  permanentDelete: boolean; // Can instances of this entity be permanently deleted
  attributes: MetaAttribute[];
}
