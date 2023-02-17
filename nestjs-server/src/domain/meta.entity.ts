import { RuleData } from './meta.rule';
import { ApiProperty } from '@nestjs/swagger';

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

export class DiscriminatorEntityMapping {
  discriminatorValue: string;
  metaEntityName: string;
}

export class DiscriminatorAttribute {
  @ApiProperty()
  discriminatorName: string;

  @ApiProperty()
  discriminatorType: string;

  @ApiProperty()
  entityMappingList: DiscriminatorEntityMapping[] = [];
}

export class MetaAttribute {
  @ApiProperty()
  name: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  type = AttributeType.Text;

  @ApiProperty()
  visibility = VisibilityType.Visible;

  @ApiProperty()
  comparisonField: string;

  @ApiProperty()
  comparisonOperator: ComparisonOperator; // Only used by Criteria objects

  @ApiProperty()
  relationshipTarget: string;

  // List of attribute names in the relationshipTarget entity used for Typeahead components
  @ApiProperty()
  typeaheadSearch: string[];

  @ApiProperty()
  discriminator: DiscriminatorAttribute;

  // List of the enumerated values (if attribute type === enumeration)
  @ApiProperty()
  enumeration: string[];

  @ApiProperty()
  unitOfMeasure: string;

  @ApiProperty()
  scale: string;

  @ApiProperty()
  rules: RuleData[];

  static isMetaAttribute(something: any) {
    return (
      something.type &&
      Object.values(AttributeType).indexOf(something.type) >= 0
    );
  }
}

export enum EntityType {
  Basic = 'Basic',
  Criteria = 'Criteria',
  Database = 'Database',
}

export class MetaEntity {
  @ApiProperty()
  name: string;

  @ApiProperty()
  pluralName: string;

  @ApiProperty()
  type: EntityType;

  @ApiProperty()
  icon: string; // icon name for this MetaEntity

  @ApiProperty()
  timestamps: boolean; // Controls if Sequelize will add createdAt and updatedAt timestamps to each record (if undefined defaults to true)

  // How long to cache instances of this entity on the client in seconds (no value means don't cache)
  @ApiProperty()
  cacheExpiryInSecs: number;

  @ApiProperty()
  permanentDelete: boolean; // Can instances of this entity be permanently deleted

  @ApiProperty()
  attributes: MetaAttribute[];
}
