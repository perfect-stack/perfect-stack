import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginNotification } from './login-notification';
import { ActionPermit } from './action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from './subject';

@Controller('authentication')
export class AuthenticationController {
  constructor(private service: AuthenticationService) {}

  @ActionPermit(ActionType.Edit)
  @SubjectName('Authentication')
  @Post('/notification')
  notification(@Body() loginNotification: LoginNotification) {
    this.service.notification(loginNotification);
  }

  @ActionPermit(ActionType.Read)
  @SubjectName('Authentication')
  @Get('/last-sign-in/:username')
  findLastSignIn(@Param('username') username: string) {
    return this.service.findLastSignIn(username);
  }
}
