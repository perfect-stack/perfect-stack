import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DataModule } from '../data/data.module';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthorizationService } from './authorization.service';
import { MetaRoleModule } from '../meta/meta-role/meta-role.module';

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
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AuthenticationController],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
