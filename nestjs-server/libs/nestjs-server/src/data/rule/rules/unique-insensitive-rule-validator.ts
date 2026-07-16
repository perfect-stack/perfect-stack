import {
  ResultType,
  RuleData,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import { MetaAttribute, MetaEntity } from '../../../domain/meta.entity';
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

    const rawValue = entity[attribute.name];
    if (rawValue) {
      const textValue = String(rawValue).trim().toLowerCase();
      const knex = await this.knexService.getKnex();

      let query;
      if (entity.id) {
        // select count(*) from table where attributeName = :value and id <> :id
        query = knex
          .select()
          .from(this.metaEntity.name)
          .where(knex.raw(`LOWER("${attribute.name}") = ?`, [textValue]))
          .andWhere('id', '<>', entity.id)
          .limit(1);
      } else {
        query = knex
          .select()
          .from(this.metaEntity.name)
          .where(knex.raw(`LOWER("${attribute.name}") = ?`, [textValue]))
          .limit(1);
      }

      const results = await query;

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
