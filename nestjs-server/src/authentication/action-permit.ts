import { SetMetadata } from '@nestjs/common';
import { ActionType } from '../domain/meta.role';

export const ACTION_PERMIT = 'ACTION_PERMIT';
export const ActionPermit = (action: ActionType) =>
  SetMetadata(ACTION_PERMIT, action);
