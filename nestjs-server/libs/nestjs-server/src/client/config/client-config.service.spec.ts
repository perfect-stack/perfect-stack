import { ConfigService } from '@nestjs/config';
import { ClientConfigService } from './client-config.service';

describe('ClientConfigService', () => {
  let service: ClientConfigService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    service = new ClientConfigService(configService);
  });

  it('should export META_EDIT_ENABLED and AUTH_DISABLE_FOR_DEV when defined', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'AUTH_DISABLE_FOR_DEV') return 'false';
      if (key === 'META_EDIT_ENABLED') return 'Entity, Menu, Page, Role';
      return undefined;
    });

    const config = service.getConfig();
    expect(config).toEqual({
      AUTH_DISABLE_FOR_DEV: 'false',
      META_EDIT_ENABLED: 'Entity, Menu, Page, Role',
    });
  });

  it('should export empty META_EDIT_ENABLED string when defined as empty', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'AUTH_DISABLE_FOR_DEV') return 'false';
      if (key === 'META_EDIT_ENABLED') return '';
      return undefined;
    });

    const config = service.getConfig();
    expect(config).toEqual({
      AUTH_DISABLE_FOR_DEV: 'false',
      META_EDIT_ENABLED: '',
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
