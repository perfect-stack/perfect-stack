import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './authentication/jwt-auth.guard';
import { OrmModule } from './orm/orm.module';
import { DataModule } from './data/data.module';
import { ClientConfigModule } from './client/config/client-config.module';
import { AdminModule } from './admin/admin.module';
import { TypeaheadModule } from './typeahead/typeahead.module';
import { MetaMenuModule } from './meta/meta-menu/meta-menu.module';
import { MetaEntityModule } from './meta/meta-entity/meta-entity.module';
import { MetaPageModule } from './meta/meta-page/meta-page.module';
import { AuditModule } from './audit/audit.module';
import { KnexModule } from './knex/knex.module';

const envFile =
  process.env.NESTJS_ENV && process.env.NESTJS_ENV.length > 0
    ? process.env.NESTJS_ENV
    : './env/local.env';

const logger = new Logger('Global');
logger.log(`Loading envFile = ${envFile}`);

export const CONFIG_MODULE = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [envFile],
});

@Module({
  imports: [
    AuditModule,
    TypeaheadModule,
    AdminModule,
    AuthenticationModule,
    ClientConfigModule,
    CONFIG_MODULE,
    KnexModule,
    OrmModule,
    MetaMenuModule,
    MetaEntityModule,
    MetaPageModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
