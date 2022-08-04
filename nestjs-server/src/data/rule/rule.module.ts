import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { KnexModule } from '../../knex/knex.module';

@Module({
  imports: [KnexModule],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}
