import {forwardRef, Module} from '@nestjs/common';
import { RuleService } from './rule.service';
import { KnexModule } from '../../knex/knex.module';
import { CustomRuleService } from './custom-rule.service';
import {DataModule} from "../data.module";

@Module({
  imports: [KnexModule, forwardRef(() => DataModule) ],
  providers: [CustomRuleService, RuleService],
  exports: [CustomRuleService, RuleService],
})
export class RuleModule {}
