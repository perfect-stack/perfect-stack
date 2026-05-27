import { Controller, Get } from '@nestjs/common';
import { ClientConfigService } from './client-config.service';
import { PublicApi } from '../../authentication/public-api';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('client')
@Controller('/client/config')
export class ClientConfigController {
  constructor(protected readonly clientConfigService: ClientConfigService) {}

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Download the client config property values',
  })
  @ApiResponse({
    status: 200,
    description: 'The client config properties',
    type: Object,
  })
  @Get('/')
  getConfig() {
    return this.clientConfigService.getConfig();
  }
}
