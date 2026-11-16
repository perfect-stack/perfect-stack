import { ConfigService } from '@nestjs/config';
import { MetaEditControlValue } from './meta-edit-control-value';

export const META_EDIT_ENABLED_CONFIG_ERROR =
  'Configuration error: META_EDIT_ENABLED must be defined in the server environment configuration (e.g. "Entity, Menu, Page, Role" or "" for none).';

export function getMetaEditEnabledList(configService: ConfigService): string[] {
  const metaEditEnabled = configService.get<string>('META_EDIT_ENABLED');
  if (metaEditEnabled === undefined || metaEditEnabled === null) {
    throw new Error(META_EDIT_ENABLED_CONFIG_ERROR);
  }

  return metaEditEnabled
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function isMetaEditEnabledFor(
  configService: ConfigService,
  controlValue: MetaEditControlValue | string,
): boolean {
  return getMetaEditEnabledList(configService).includes(controlValue);
}

export function isMetaCacheEnabledFor(
  configService: ConfigService,
  controlValue: MetaEditControlValue | string,
): boolean {
  return !isMetaEditEnabledFor(configService, controlValue);
}
