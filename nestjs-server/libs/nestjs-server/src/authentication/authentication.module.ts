import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DataModule } from '../data/data.module';
import { PassportModule } from '@nestjs/passport';
import { AuthorizationService } from './authorization.service';
import { MetaRoleModule } from '../meta/meta-role/meta-role.module';
import { UserNameService } from './user-name.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    DataModule,
    MetaRoleModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [
    AuthenticationService,
    AuthorizationService,
    JwtStrategy,
    UserNameService,
  ],
  controllers: [AuthenticationController],
  exports: [AuthenticationService, AuthorizationService],
})
export class AuthenticationModule {}
