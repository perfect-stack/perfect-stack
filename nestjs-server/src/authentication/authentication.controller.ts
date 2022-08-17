import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LoginNotification } from './login-notification';

@Controller('authentication')
export class AuthenticationController {
  constructor(private service: AuthenticationService) {}

  @Post('/notification')
  notification(@Body() loginNotification: LoginNotification) {
    this.service.notification(loginNotification);
  }
}
