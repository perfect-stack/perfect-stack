import { MetaAttribute, MetaEntity } from './meta.entity';

export enum RuleType {
  Custom = 'Custom',
  Email = 'Email',
  Pattern = 'Pattern',
  Range = 'Range',
  Required = 'Required',
  Unique = 'Unique',
  UniqueInsensitive = 'UniqueInsensitive',
}

export class RuleData {
  type: RuleType;
  // Range: "minValue,maxValue" where each value can be a number, or a DateRuleName
  // Custom: "nameOfCustomValidator"
  // Pattern: "regex pattern"
  config: string;
}

export type DateRuleName = '$yesterday' | '$today' | '$now' | '$tomorrow';

export class RangeRuleConfig {
  minValue: number | DateRuleName | null;
  maxValue: number | DateRuleName | null;
}

export abstract class RuleValidator {
  constructor(
    public metaEntity: MetaEntity,
    public metaAttribute: MetaAttribute,
    public ruleData: RuleData,
  ) {}

  abstract validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null>;
}

export enum ResultType {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
}

export class ValidationResult {
  name: string;
  resultType: ResultType;
  message: string;
}

// client setup, sweep though MetaEntity but only do the ones the run on the client
// server setup, for a MetaEntity create and execute all validation rules

export class ValidationResultMap {
  [key: string]: ValidationResult;
}

export class ValidationResultMapController {
  constructor(public validationResultMap: ValidationResultMap) {}

  hasErrors() {
    for (const resultKey of Object.keys(this.validationResultMap)) {
      const result = this.validationResultMap[resultKey];
      if (result.resultType === ResultType.Error) {
        return true;
      }
    }
    return false;
  }
}

export abstract class MetaEntityRuleValidator {
  abstract validate(
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
  ): Promise<ValidationResultMap>;
}
