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

export class UniqueRuleValidator extends RuleValidator {
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

    const value = entity[attribute.name];
    if (value) {
      // select count(*) from table where attributeName = :value and id <> :id
      const knex = await this.knexService.getKnex();
      const results: any[] = await knex
        .select()
        .from(this.metaEntity.name)
        .where(attribute.name, '=', value)
        .andWhere('id', '<>', entity.id)
        .limit(1);

      // valid = count(*) === 0
      const valid = results.length === 0;
      if (!valid) {
        validationResult = {
          name: attribute.name,
          resultType: ResultType.Error,
          message: 'Attribute value must be unique',
        };
      }
    }

    return validationResult;
  }
}
