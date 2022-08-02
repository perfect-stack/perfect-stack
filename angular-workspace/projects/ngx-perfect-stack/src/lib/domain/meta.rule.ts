import {MetaAttribute, MetaEntity} from './meta.entity';

export enum RuleType {
  Required = 'Required',
  Range = 'Range',
  Pattern = 'Pattern',
  Email = 'Email',
  Unique = 'Unique',
  Custom = 'Custom',
}

export class RuleData {
  type: RuleType;
  customValidatorName: string; // name of the custom validator if type = 'Custom'
  config: any;
}

export class RuleValidator {
  metaEntity: MetaEntity;
  metaAttribute: MetaAttribute;
  ruleData: RuleData;

  async validate(entity: any, attribute: MetaAttribute): Promise<ValidationResult | null>;
}


export enum ResultType {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error'
}

export class ValidationResult {
  name: string;
  resultType: ResultType;
  message: string;
}


// client setup, sweep though MetaEntity but only do the ones the run on the client
// server setup, for a MetaEntity create and execute all validation rules


export class ValidationResultMap {
  [string: any]: ValidationResult;
}

export class MetaEntityRuleValidator {
  async validate(entity): Promise<ValidationResultMap>
}



