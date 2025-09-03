import {Logger, Module} from '@nestjs/common';
import { KimsServerController } from './kims-server.controller';
import { KimsServerService } from './kims-server.service';
import {ConfigModule} from "@nestjs/config";
import {
    AuthenticationModule,
    BatchModule,
    ClientConfigModule, DataImportModule,
    DataModule, JobModule,
    JwtAuthGuard, MediaRepositoryModule, MetaEntityModule, MetaMenuModule, MetaPageModule, OrmModule,
    TypeaheadModule
} from "@perfect-stack/nestjs-server";
import {AppEventModule} from "./app-event/app-event.module";
import {AuditModule} from "@perfect-stack/nestjs-server/audit/audit.module";
import {AdminModule} from "@perfect-stack/nestjs-server/admin/admin.module";
import {EventModule} from "@perfect-stack/nestjs-server/event/event.module";
import {EventEmitterModule} from "@nestjs/event-emitter";
import {KnexModule} from "@perfect-stack/nestjs-server/knex/knex.module";
import {MapModule} from "@perfect-stack/nestjs-server/map/map.module";
import {MetaRoleModule} from "@perfect-stack/nestjs-server/meta/meta-role/meta-role.module";
import {MigrateModule} from "@perfect-stack/nestjs-server/migrate/mirgrate.module";
import {RuleModule} from "@perfect-stack/nestjs-server/data/rule/rule.module";
import {SettingsModule} from "@perfect-stack/nestjs-server/settings/settings.module";
import {APP_GUARD} from "@nestjs/core";

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
      BatchModule,
      ClientConfigModule,
      DataModule,
      DataImportModule,
      CONFIG_MODULE,
      EventModule,
      EventEmitterModule.forRoot(),
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
  controllers: [KimsServerController],
  providers: [
      KimsServerService,
      {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
      },
  ],
})
export class KimsServerModule {}
