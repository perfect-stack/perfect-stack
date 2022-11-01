import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { KnexModule } from '../../knex/knex.module';
import { CustomRuleService } from './custom-rule.service';

@Module({
  imports: [KnexModule],
  providers: [CustomRuleService, RuleService],
  exports: [CustomRuleService, RuleService],
})
export class RuleModule {}
