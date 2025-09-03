import { Injectable } from '@nestjs/common';
import { RuleValidator } from '../../domain/meta.rule';

@Injectable()
export class CustomRuleService {
  private ruleMap = new Map<string, RuleValidator>();

  addCustomRule(name: string, ruleValidator: RuleValidator) {
    if (!this.ruleMap.has(name)) {
      this.ruleMap.set(name, ruleValidator);
    } else {
      throw new Error(`RuleMap already contains a rule for ${name}`);
    }
  }

  getCustomRule(name: string): RuleValidator {
    if (this.ruleMap.has(name)) {
      return this.ruleMap.get(name);
    } else {
      throw new Error(`Unable to fine rule for ${name}`);
    }
  }
}
