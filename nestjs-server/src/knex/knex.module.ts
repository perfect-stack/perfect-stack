import { Module } from '@nestjs/common';
import { KnexService } from './knex.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [KnexService],
  exports: [KnexService],
})
export class KnexModule {}
