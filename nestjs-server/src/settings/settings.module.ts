import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
