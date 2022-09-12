import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { PUBLIC_API_KEY } from './public-api';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ActionType } from '../domain/meta.role';
import { ACTION_PERMIT } from './action-permit';
import { SUBJECT_KEY } from './subject';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    protected readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (this.configService.get('AUTH_DISABLE_FOR_DEV') === 'true') {
      console.log('Auth Disabled');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // if (user) {
    //   console.log(`User: ${JSON.stringify(user)}`);
    // } else {
    //   console.log(`NO USER FOUND`);
    // }
    console.log('GUARD:' + JSON.stringify(Object.keys(request)));

    const actionPermit = this.reflector.getAllAndOverride<ActionType>(
      ACTION_PERMIT,
      [context.getHandler(), context.getClass()],
    );

    const subjectKey = this.reflector.getAllAndOverride<string>(SUBJECT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    let subject = null;
    if (subjectKey) {
      const params = context.switchToHttp().getRequest().params;
      //console.log(`params = ${JSON.stringify(params)}`);
      subject = params[subjectKey];
    }

    const contextName = `${context.getClass().name}.${
      context.getHandler().name
    }`;

    if (actionPermit && subject) {
      console.log(
        `Permission Check: ${contextName}: ACTION_PERMIT = ${actionPermit}.${subject}`,
      );
    } else {
      console.log(
        `Permission Check: UNABLE to find action.subject for ${contextName}`,
      );
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
