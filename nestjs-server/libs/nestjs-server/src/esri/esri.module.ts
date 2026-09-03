import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ESRIService, EsriService } from './esri.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ESRIService],
  exports: [ESRIService],
})
export class EsriModule {}

export { EsriModule as ESRIModule, ESRIService, EsriService };
