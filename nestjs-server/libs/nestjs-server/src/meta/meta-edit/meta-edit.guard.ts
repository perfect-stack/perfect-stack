import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { META_EDIT_ACTION_PERMIT } from './meta-edit-action-permit.decorator';
import { getMetaEditEnabledList } from './meta-edit-utils';

@Injectable()
export class MetaEditGuard implements CanActivate {
  private readonly logger = new Logger(MetaEditGuard.name);
  protected readonly reflector: Reflector;

  constructor(
    @Optional() reflector: Reflector,
    protected readonly configService: ConfigService,
  ) {
    this.reflector = reflector || new Reflector();
  }

  canActivate(context: ExecutionContext): boolean {
    const controlValue = this.reflector.getAllAndOverride<string>(
      META_EDIT_ACTION_PERMIT,
      [context.getHandler(), context.getClass()],
    );

    if (!controlValue) {
      return true;
    }

    const enabledList = getMetaEditEnabledList(this.configService);

    if (!enabledList.includes(controlValue)) {
      const metaEditEnabled = this.configService.get<string>('META_EDIT_ENABLED');
      this.logger.warn(
        `Meta edit rejected: ${controlValue} is not in META_EDIT_ENABLED [${metaEditEnabled}]`,
      );
      throw new ForbiddenException(
        `Editing of ${controlValue} metadata is disabled in this environment.`,
      );
    }

    return true;
  }
}
