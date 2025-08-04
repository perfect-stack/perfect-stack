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
import { RuleModule } from './data/rule/rule.module';
import { EventModule } from './event/event.module';
import { AppEventModule } from './app-event/app-event.module';
import { SettingsModule } from './settings/settings.module';
import { MetaRoleModule } from './meta/meta-role/meta-role.module';
import { MapModule } from './map/map.module';
import {MediaRepositoryModule} from "./media/media-repository.module";
import {MigrateModule} from "./migrate/mirgrate.module";
import {DataImportModule} from "./data/import/data-import.module";
import {JobModule} from "./job/job.module";

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
    AppEventModule,
    AuditModule,
    AuthenticationModule,
    AdminModule,
    AuthenticationModule,
    ClientConfigModule,
    DataModule,
    DataImportModule,
    CONFIG_MODULE,
    EventModule,
    JobModule,
    KnexModule,
    OrmModule,
    MapModule,
    MediaRepositoryModule,
    MetaMenuModule,
    MetaEntityModule,
    MetaPageModule,
    MetaRoleModule,
    MigrateModule,
    RuleModule,
    SettingsModule,
    TypeaheadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
