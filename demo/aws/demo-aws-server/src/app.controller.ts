import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PublicApi } from '@perfect-stack/nestjs-server/dist/authentication/public-api';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @PublicApi()
  get(): string {
    return this.appService.get();
  }

  @Get('/health')
  @PublicApi()
  getHealth(): string {
    return this.appService.get();
  }
}

