import { Module } from '@nestjs/common';
import { NestjsServerService } from './nestjs-server.service';

@Module({
  providers: [NestjsServerService],
  exports: [NestjsServerService],
})
export class NestjsServerModule {}
