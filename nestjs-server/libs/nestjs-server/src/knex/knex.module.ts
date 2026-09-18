import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KnexService } from './knex.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [ConfigModule, SettingsModule],
  providers: [KnexService],
  exports: [KnexService],
})
export class KnexModule {}
