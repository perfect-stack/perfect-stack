import { HttpModule, Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [HttpModule, JwtModule.register({})],
  providers: [AuthenticationService, JwtStrategy],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
