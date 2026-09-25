import { Controller, Get, Module, Post, Body, Param } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  ClientConfigModule,
  DataModule,
  KnexModule,
  MetaEntityModule,
  MetaMenuModule,
  MetaPageModule,
  MetaRoleModule,
  OrmModule,
  RuleModule,
  SettingsModule,
  TypeaheadModule,
} from '@perfect-stack/nestjs-server';
import * as path from 'path';

const envFile = process.env.NESTJS_ENV || path.resolve(__dirname, '../local.env');

export const CONFIG_MODULE = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [envFile],
});

@Controller('authentication')
export class TestAuthenticationController {
  @Post('notification')
  loginNotification(@Body() body: any) {
    return { success: true };
  }

  @Get('last-sign-in/:username')
  lastSignIn(@Param('username') username: string) {
    return { username, lastSignIn: new Date().toISOString() };
  }
}

@Module({
  imports: [
    CONFIG_MODULE,
    EventEmitterModule.forRoot(),
    OrmModule,
    KnexModule,
    MetaEntityModule,
    MetaMenuModule,
    MetaPageModule,
    MetaRoleModule,
    DataModule,
    RuleModule,
    SettingsModule,
    TypeaheadModule,
    ClientConfigModule,
  ],
  controllers: [TestAuthenticationController],
})
export class VetClinicServerModule {}
