import { Controller, Get } from '@nestjs/common';
import { ClientConfigService } from './client-config.service';
import { PublicApi } from '../../authentication/public-api';

@Controller('/client/config')
export class ClientConfigController {
  constructor(protected readonly clientConfigService: ClientConfigService) {}

  @PublicApi()
  @Get('/')
  getConfig() {
    return this.clientConfigService.getConfig();
  }
}
