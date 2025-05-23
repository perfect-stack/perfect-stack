import {forwardRef, Inject, Injectable, Logger} from '@nestjs/common';
import {
  AttributeType,
  MetaAttribute,
  MetaEntity,
} from '../../domain/meta.entity';
import {
  MetaEntityRuleValidator,
  RuleData,
  RuleType,
  RuleValidator,
  ValidationResultMap,
} from '../../domain/meta.rule';
import { RangeRuleValidator } from './rules/range-rule-validator';
import { RequiredRuleValidator } from './rules/required-rule-validator';
import { UniqueRuleValidator } from './rules/unique-rule-validator';
import { KnexService } from '../../knex/knex.service';
import { UniqueInsensitiveRuleValidator } from './rules/unique-insensitive-rule-validator';
import { EmailRuleValidator } from './rules/email-rule-validator';
import { CustomRuleService } from './custom-rule.service';
import {DiscriminatorService} from "../discriminator.service";

@Injectable()
export class RuleService implements MetaEntityRuleValidator {
  private readonly logger = new Logger(RuleService.name);

  constructor(
    protected readonly customRuleService: CustomRuleService,
    protected readonly knexService: KnexService,
    @Inject(forwardRef(() => DiscriminatorService))
    protected discriminatorService: DiscriminatorService
  ) {}

  async validate(
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
  ): Promise<ValidationResultMap> {
    const validationResultMap = {};

    // validate the graph of objects starting at the root path of ''
    await this.validateOneObject(
      '',
      entity,
      metaEntity,
      metaEntityMap,
      validationResultMap,
    );

    return validationResultMap;
  }

  async validateOneObject(
    path: string,
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
    validationResultMap: ValidationResultMap,
  ): Promise<void> {
    for (const attribute of metaEntity.attributes) {
      await this.validateOneAttribute(
        path,
        entity,
        metaEntity,
        metaEntityMap,
        validationResultMap,
        attribute,
      );
    }
  }

  async validateOneAttribute(
    path: string,
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
    validationResultMap: ValidationResultMap,
    attribute: MetaAttribute,
  ) {
    const rules = attribute.rules;
    if (rules && rules.length > 0) {
      for (const ruleData of rules) {
        const rule = this.createValidatorRule(ruleData, metaEntity, attribute);

        const validationResult = await rule.validate(entity, attribute);

        if (validationResult) {
          let key;
          if (path.length > 0) {
            key = `${path}.${validationResult.name}`;
          } else {
            key = validationResult.name;
          }
          validationResultMap[key] = validationResult;
          this.logger.log(
            `Validation result: ${JSON.stringify(validationResult)}`,
          );
        }
      }
    }

    if (
      attribute.type === AttributeType.OneToMany ||
      attribute.type === AttributeType.OneToPoly
    ) {
      // This is an array type, so get the attribute value and iterate through the items in the array (if any)
      const attributeValue = entity[attribute.name] as [];

      for (let i = 0; i < attributeValue.length; i++) {
        const nextPath = this.appendPath(path, `${attribute.name}.${i}`);
        const nextEntity = attributeValue[i];

        let nextMetaEntity = null;
        if (attribute.type === AttributeType.OneToMany) {
          nextMetaEntity = metaEntityMap.get(attribute.relationshipTarget);
          if (!nextMetaEntity) {
            throw new Error(
              `Unable to find MetaEntity for attribute ${attribute.name} with relationshipTarget of ${attribute.relationshipTarget}`,
            );
          }
        }
        else if (attribute.type === AttributeType.OneToPoly) {
          nextMetaEntity = await this.getMetaEntityFromAttributeValue(
            attribute,
            nextEntity,
            metaEntityMap,
          );
        }
        else {
          throw new Error('Unexpected situation');
        }

        await this.validateOneObject(
          nextPath,
          nextEntity,
          nextMetaEntity,
          metaEntityMap,
          validationResultMap,
        );
      }
    } else if (attribute.type === AttributeType.OneToOne) {
      // This is a child object, so get the attribute value and recursively validate it
      const nextPath = this.appendPath(path, attribute.name);
      const nextEntity = entity[attribute.name];
      const nextMetaEntity = metaEntityMap.get(attribute.relationshipTarget);
      if (!nextMetaEntity) {
        throw new Error(
          `Unable to find MetaEntity for attribute ${attribute.name} with relationshipTarget of ${attribute.relationshipTarget}`,
        );
      }
      await this.validateOneObject(
        nextPath,
        nextEntity,
        nextMetaEntity,
        metaEntityMap,
        validationResultMap,
      );
    }
    // Else the attribute is a simple type or a ManyToOne. For the simple types we already did the rule validation at
    // the top of the method. For the ManyToOne objects we don't validate them now since the relationship we have here/now
    // is just a pointer. ManyToOne targets are validated when they themselves are updated.
  }

  private appendPath(path: string, append: string): string {
    let result = path;
    if (path && path.length > 0) {
      result = result + '.';
    }
    return result + append;
  }

  private createValidatorRule(
    ruleData: RuleData,
    metaEntity: MetaEntity,
    attribute: MetaAttribute,
  ): RuleValidator | null {
    switch (ruleData.type) {
      case RuleType.Custom:
        return this.createCustomRuleValidator(metaEntity, attribute, ruleData);
      case RuleType.Email:
        return new EmailRuleValidator(metaEntity, attribute, ruleData);
      case RuleType.Required:
        return new RequiredRuleValidator(metaEntity, attribute, ruleData);
      case RuleType.Range:
        return new RangeRuleValidator(metaEntity, attribute, ruleData);
      case RuleType.Unique:
        return new UniqueRuleValidator(
          this.knexService,
          metaEntity,
          attribute,
          ruleData,
        );
      case RuleType.UniqueInsensitive:
        return new UniqueInsensitiveRuleValidator(
          this.knexService,
          metaEntity,
          attribute,
          ruleData,
        );
      default:
        throw new Error(
          `Unknown rule type of "${ruleData.type}". Unable to fine RuleValidator`,
        );
    }
  }

  private createCustomRuleValidator(
    metaEntity: MetaEntity,
    attribute: MetaAttribute,
    ruleData: RuleData,
  ): RuleValidator {
    const rulePrototype = this.customRuleService.getCustomRule(ruleData.config);
    const rule = Object.create(rulePrototype);
    rule.metaEntity = metaEntity;
    rule.metaAttribute = attribute;
    rule.ruleData = ruleData;
    return rule;
  }

  private async getMetaEntityFromAttributeValue(
    attribute: MetaAttribute,
    childItem: any,
    metaEntityMap: Map<string, MetaEntity>,
  ) {

    const discriminatorMap = await this.discriminatorService.findDiscriminatorMap(attribute);
    const discriminator = attribute.discriminator;
    const discriminatorValue = childItem[discriminator.discriminatorName + "_id"];

    const discriminatorMapping = discriminatorMap.get(discriminatorValue);
    const metaEntity = metaEntityMap.get(discriminatorMapping.metaEntityName);
    if(metaEntity) {
      return metaEntity;
    }
    else {
      throw new Error(`Unable to find MetaEntity for discriminator value ${discriminatorValue}`);
    }
  }
}
