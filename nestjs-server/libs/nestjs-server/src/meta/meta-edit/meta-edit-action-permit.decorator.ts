import { SetMetadata } from '@nestjs/common';
import { MetaEditControlValue } from './meta-edit-control-value';

export const META_EDIT_ACTION_PERMIT = 'META_EDIT_ACTION_PERMIT';
export const MetaEditActionPermit = (
  controlValue: MetaEditControlValue | string,
) => SetMetadata(META_EDIT_ACTION_PERMIT, controlValue);
