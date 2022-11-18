import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PublicApi } from './authentication/public-api';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @PublicApi()
  @ApiOperation({
    summary: 'Return a Health Check message',
  })
  @Get()
  get(): string {
    return this.appService.get();
  }

  @PublicApi()
  @ApiOperation({
    summary: 'Return a Health Check message',
  })
  @Get('/health')
  getHealth(): string {
    return this.appService.get();
  }
}
