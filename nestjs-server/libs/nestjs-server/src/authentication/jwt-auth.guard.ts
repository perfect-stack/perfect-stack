import {
  ExecutionContext,
  Injectable, Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PUBLIC_API_KEY } from './public-api';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ActionType } from '../domain/meta.role';
import { ACTION_PERMIT } from './action-permit';
import { SUBJECT_KEY, SUBJECT_NAME } from './subject';
import { AuthorizationService } from './authorization.service';
import { User } from './user';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    protected readonly reflector: Reflector,
    protected readonly configService: ConfigService,
    protected readonly authorizationService: AuthorizationService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextName = this.getContextName(context);
    this.logger.debug(`GUARD: STARTED - ${contextName}`);

    if (this.configService.get('AUTH_DISABLE_FOR_DEV') === 'true') {
      this.logger.debug('GUARD: Auth Disabled');
      return true;
    }

    if (this.isPublic(context)) {
      this.logger.debug('GUARD: isPublic');
      return true;
    }

    // call super first to extract user and add it to the request
    await super.canActivate(context);

    const userGroups = this.getUserGroups(context);
    const actionPermit = this.getActionPermit(context);
    const subject = this.getSubject(context);

    if (actionPermit && subject) {
      this.logger.debug(
        `GUARD: Permission Check: ${contextName}: ACTION_PERMIT = ${actionPermit}.${subject}`,
      );

      const permissionMap = await this.authorizationService.loadPermissions();

      const permitted = this.authorizationService.checkPermissionWithMap(
        userGroups,
        permissionMap,
        actionPermit,
        subject,
      );

      if (!permitted) {
        const username = this.getUser(context).username;
        throw new UnauthorizedException(
          `Permission Check Failed: On method ${contextName}(). User ${username} with groups ${JSON.stringify(
            userGroups,
          )} does not have the required permission ${actionPermit}.${subject}`,
        );
      }
    } else {
      this.logger.debug(
        `GUARD: Permission Check: UNABLE to find action.subject for ${contextName}`,
      );
    }

    return true;
  }

  isPublic(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic;
  }

  getContextName(context: ExecutionContext) {
    return `${context.getClass().name}.${context.getHandler().name}`;
  }

  getUser(context: ExecutionContext): User {
    const request = context.switchToHttp().getRequest();
    return request.user;
  }

  getUsername(context: ExecutionContext): string {
    return this.getUser(context).username;
  }

  getUserGroups(context: ExecutionContext): string[] {
    let userGroups = null;
    const user = this.getUser(context);
    if (user) {
      userGroups = user.groups;
      if (userGroups) {
        this.logger.debug(`GUARD: Found user groups: ${JSON.stringify(userGroups)}`);
      }
    } else {
      this.logger.debug(`GUARD: NO USER FOUND`);
      throw new UnauthorizedException(
        `GUARD: NO USER FOUND. ${this.getContextName(context)}`,
      );
    }
    return userGroups;
  }

  getActionPermit(context: ExecutionContext): string {
    const actionPermit = this.reflector.getAllAndOverride<ActionType>(
      ACTION_PERMIT,
      [context.getHandler(), context.getClass()],
    );
    return actionPermit;
  }

  getSubject(context: ExecutionContext): string {
    let subject = null;
    const subjectName = this.reflector.getAllAndOverride<string>(SUBJECT_NAME, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (subjectName) {
      subject = subjectName;
    } else {
      const subjectKey = this.reflector.getAllAndOverride<string>(SUBJECT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (subjectKey) {
        subject = this.getSubjectFromParams(context, subjectKey);
      } else {
        throw new Error(
          `Invalid Security definition. No @SubjectName() or @SubjectKey() has been defined for "${this.getContextName(
            context,
          )}"`,
        );
      }
    }
    return subject;
  }

  getSubjectFromParams(context: ExecutionContext, subjectKey: string): string {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const body = request.body;
    const target = Object.keys(params).length > 0 ? params : body;
    const subject = this.evaluatePath(subjectKey.split('.'), target);

    if (!subject) {
      this.logger.debug(
        `!! UNABLE: to find subjectKey ${subjectKey} for ${this.getContextName(
          context,
        )}`,
      );
    }
    return subject;
  }

  private evaluatePath(pathElements: string[], target: any): any {
    if (pathElements.length > 1) {
      return this.evaluatePath(pathElements.slice(1), target[pathElements[0]]);
    } else {
      return target[pathElements[0]];
    }
  }

  handleRequest(err, user, info, context, status): any {

    // WARNING: even if this method is "greyed" out don't remove it. It is called by the passport strategy

    // if (err || !user) {
    //   throw err || new UnauthorizedException();
    // }
    return user;
  }
}
