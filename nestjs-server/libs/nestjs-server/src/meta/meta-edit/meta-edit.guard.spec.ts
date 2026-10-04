import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MetaEditGuard } from './meta-edit.guard';
import { MetaEditControlValue } from './meta-edit-control-value';
import { META_EDIT_ACTION_PERMIT } from './meta-edit-action-permit.decorator';

describe('MetaEditGuard', () => {
  let guard: MetaEditGuard;
  let reflector: Reflector;
  let configService: ConfigService;

  beforeEach(() => {
    reflector = new Reflector();
    configService = new ConfigService();
    guard = new MetaEditGuard(reflector, configService);
  });

  const createMockContext = (): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should allow execution when no MetaEditActionPermit is defined on handler or class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw an informative Error when META_EDIT_ENABLED is undefined', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(MetaEditControlValue.Entity);
    jest.spyOn(configService, 'get').mockReturnValue(undefined);

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(
      'Configuration error: META_EDIT_ENABLED must be defined in the server environment configuration (e.g. "Entity, Menu, Page, Role" or "" for none).',
    );
  });

  it('should throw ForbiddenException when META_EDIT_ENABLED is an empty string', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(MetaEditControlValue.Entity);
    jest.spyOn(configService, 'get').mockReturnValue('');

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow permitted control value when present in META_EDIT_ENABLED', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(MetaEditControlValue.Entity);
    jest
      .spyOn(configService, 'get')
      .mockReturnValue('Entity, Menu, Page, Role');

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when control value is not in META_EDIT_ENABLED', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(MetaEditControlValue.Role);
    jest.spyOn(configService, 'get').mockReturnValue('Entity, Menu, Page');

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Editing of Role metadata is disabled in this environment.',
    );
  });

  it('should enforce case sensitivity strictly', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(MetaEditControlValue.Entity);
    jest.spyOn(configService, 'get').mockReturnValue('entity, menu');

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should handle whitespace in comma-separated list correctly', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(MetaEditControlValue.Menu);
    jest.spyOn(configService, 'get').mockReturnValue(' Entity , Menu , Page ');

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });
});
