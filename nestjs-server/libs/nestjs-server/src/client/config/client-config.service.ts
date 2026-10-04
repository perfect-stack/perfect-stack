import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientConfigService {
  static readonly CLIENT_PROPERTIES_EXPORTED = [
    'AUTH_DISABLE_FOR_DEV',
    'META_EDIT_ENABLED',
  ];

  constructor(protected readonly configService: ConfigService) {}

  getConfig() {
    const config = {};

    for (const nextProperty of ClientConfigService.CLIENT_PROPERTIES_EXPORTED) {
      config[nextProperty] = this.configService.get(nextProperty);
    }

    if (
      config['META_EDIT_ENABLED'] === undefined ||
      config['META_EDIT_ENABLED'] === null
    ) {
      throw new Error(
        'Configuration error: META_EDIT_ENABLED must be defined in the server environment configuration (e.g. "Entity, Menu, Page, Role" or "" for none).',
      );
    }

    return config;
  }
}
