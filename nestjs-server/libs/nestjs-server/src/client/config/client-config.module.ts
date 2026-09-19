import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigController } from './client-config.controller';
import { ClientConfigService } from './client-config.service';

@Module({
  imports: [ConfigModule],
  controllers: [ClientConfigController],
  providers: [ClientConfigService],
  exports: [ClientConfigService],
})
export class ClientConfigModule {}
