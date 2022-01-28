import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './authentication/jwt-auth.guard';
import { OrmModule } from './orm/orm.module';
import { DataModule } from './data/data.module';
import { MetaEntityModule } from './meta/meta-entity/meta-entity.module';
import { MetaMenuModule } from './meta/meta-menu/meta-menu.module';
import { MetaPageModule } from './meta/meta-page/meta-page.module';
import { ClientConfigModule } from './client/config/client-config.module';
import { AdminModule } from './admin/admin.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';

const envFile =
  process.env.NESTJS_ENV && process.env.NESTJS_ENV.length > 0
    ? process.env.NESTJS_ENV
    : './env/local.env';

const logger = new Logger('Global');
logger.log(`envFile = ${envFile}`);

@Module({
  imports: [
    AdminModule,
    AuthenticationModule,
    ClientConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envFile],
    }),
    OrmModule,
    MikroOrmModule.forRoot({
      discovery: { warnWhenNoEntities: false },
      //entities: [Person],
      //entitiesTs: [Person],
      type: 'postgresql',
      dbName: 'perfect-stack-demo-db',
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'Password01',
      //metadataProvider: MyMetadataProviderService,
    }),
    MetaEntityModule,
    MetaMenuModule,
    MetaPageModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
