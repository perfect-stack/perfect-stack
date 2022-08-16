import {
  ResultType,
  RuleData,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import {
  AttributeType,
  MetaAttribute,
  MetaEntity,
} from '../../../domain/meta.entity';
import { KnexService } from '../../../knex/knex.service';

export class UniqueInsensitiveRuleValidator extends RuleValidator {
  constructor(
    protected readonly knexService: KnexService,
    metaEntity: MetaEntity,
    metaAttribute: MetaAttribute,
    ruleData: RuleData,
  ) {
    super(metaEntity, metaAttribute, ruleData);
  }

  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    let validationResult = null;

    const value = String(entity[attribute.name]);
    if (value) {
      const knex = await this.knexService.getKnex();

      let results: any[];
      if (entity.id) {
        // select count(*) from table where attributeName = :value and id <> :id
        results = await knex
          .select()
          .from(this.metaEntity.name)
          .where(
            knex.raw(`LOWER(${attribute.name}) = '${value.toLowerCase()}'`),
          ) // This is different to the UniqueRuleValidator
          .andWhere('id', '<>', entity.id)
          .limit(1);
      } else {
        results = await knex
          .select()
          .from(this.metaEntity.name)
          .where(
            knex.raw(`LOWER(${attribute.name}) = '${value.toLowerCase()}'`),
          ) // This is different to the UniqueRuleValidator
          .limit(1);
      }

      // valid = count(*) === 0
      const valid = results.length === 0;
      if (!valid) {
        validationResult = {
          name: attribute.name,
          resultType: ResultType.Error,
          message: 'Attribute value must be unique (case insensitive)',
        };
      }
    }

    return validationResult;
  }
}
