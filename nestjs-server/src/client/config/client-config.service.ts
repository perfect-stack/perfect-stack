import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientConfigService {
  static readonly CLIENT_PROPERTIES_EXPORTED = ['AUTH_DISABLE_FOR_DEV'];

  constructor(protected readonly configService: ConfigService) {}

  getConfig() {
    const config = {};

    for (const nextProperty of ClientConfigService.CLIENT_PROPERTIES_EXPORTED) {
      config[nextProperty] = this.configService.get(nextProperty);
    }

    return config;
  }
}
