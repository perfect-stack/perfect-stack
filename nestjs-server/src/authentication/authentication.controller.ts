import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginNotification } from './login-notification';
import { ActionPermit } from './action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from './subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private service: AuthenticationService) {}

  @ActionPermit(ActionType.Edit)
  @SubjectName('Authentication')
  @ApiOperation({
    summary:
      'Callback from the client to notify the server that a login has been successful. Used for the time of Last Sign In.',
  })
  @Post('/notification')
  notification(@Body() loginNotification: LoginNotification) {
    return this.service.notification(loginNotification);
  }

  @ActionPermit(ActionType.Read)
  @SubjectName('Authentication')
  @ApiOperation({
    summary: 'Find the Last Sign In time of the requested username',
  })
  @Get('/last-sign-in/:username')
  findLastSignIn(@Param('username') username: string) {
    return this.service.findLastSignIn(username);
  }
}
