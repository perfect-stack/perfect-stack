import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginNotification } from './login-notification';

@Controller('authentication')
export class AuthenticationController {
  constructor(private service: AuthenticationService) {}

  @Post('/notification')
  notification(@Body() loginNotification: LoginNotification) {
    this.service.notification(loginNotification);
  }

  @Get('/last-sign-in/:username')
  findLastSignIn(@Param('username') username: string) {
    return this.service.findLastSignIn(username);
  }
}
