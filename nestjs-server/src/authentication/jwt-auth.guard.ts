import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PUBLIC_API_KEY } from './public-api';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ActionType } from '../domain/meta.role';
import { ACTION_PERMIT } from './action-permit';
import { SUBJECT_KEY, SUBJECT_NAME } from './subject';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    protected readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextName = this.getContextName(context);
    console.log(`\nGUARD: STARTED - ${contextName}`);

    if (this.configService.get('AUTH_DISABLE_FOR_DEV') === 'true') {
      console.log('GUARD: Auth Disabled');
      return true;
    }

    if (this.isPublic(context)) {
      console.log('GUARD: isPublic');
      return true;
    }

    // call super first to extract user and add it to the request
    await super.canActivate(context);

    const userGroups = this.getUserGroups(context);
    const actionPermit = this.getActionPermit(context);
    const subject = this.getSubject(context);

    if (actionPermit && subject) {
      console.log(
        `GUARD: Permission Check: ${contextName}: ACTION_PERMIT = ${actionPermit}.${subject}`,
      );
    } else {
      console.log(
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

  getUserGroups(context: ExecutionContext): string[] {
    let userGroups = null;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user) {
      userGroups = user['cognito:groups'];
      if (userGroups) {
        console.log(`GUARD: Found user groups: ${JSON.stringify(userGroups)}`);
      }
    } else {
      console.log(`GUARD: NO USER FOUND`);
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
        const params = context.switchToHttp().getRequest().params;
        subject = params[subjectKey];
      }
    }
    return subject;
  }

  handleRequest(err, user, info, context, status): any {
    console.log(`GUARD: handle request`);

    // if (err || !user) {
    //   throw err || new UnauthorizedException();
    // }
    return user;
  }
}
