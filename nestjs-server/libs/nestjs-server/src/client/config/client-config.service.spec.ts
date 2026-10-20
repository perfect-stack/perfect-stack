import { ConfigService } from '@nestjs/config';
import { ClientConfigService } from './client-config.service';

describe('ClientConfigService', () => {
  let service: ClientConfigService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    service = new ClientConfigService(configService);
  });

  it('should export META_EDIT_ENABLED, AUTH_DISABLE_FOR_DEV, and ENV_NAME when defined', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'AUTH_DISABLE_FOR_DEV') return 'false';
      if (key === 'META_EDIT_ENABLED') return 'Entity, Menu, Page, Role';
      if (key === 'ENV_NAME') return 'dev';
      return undefined;
    });

    const config = service.getConfig();
    expect(config).toEqual({
      AUTH_DISABLE_FOR_DEV: 'false',
      META_EDIT_ENABLED: 'Entity, Menu, Page, Role',
      ENV_NAME: 'dev',
    });
  });

  it('should export empty META_EDIT_ENABLED string when defined as empty', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'AUTH_DISABLE_FOR_DEV') return 'false';
      if (key === 'META_EDIT_ENABLED') return '';
      if (key === 'ENV_NAME') return 'prod';
      return undefined;
    });

    const config = service.getConfig();
    expect(config).toEqual({
      AUTH_DISABLE_FOR_DEV: 'false',
      META_EDIT_ENABLED: '',
      ENV_NAME: 'prod',
    });
  });

  it('should throw an informative Error when META_EDIT_ENABLED is undefined', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'AUTH_DISABLE_FOR_DEV') return 'false';
      return undefined;
    });

    expect(() => service.getConfig()).toThrow(
      'Configuration error: META_EDIT_ENABLED must be defined in the server environment configuration (e.g. "Entity, Menu, Page, Role" or "" for none).',
    );
  });
});
