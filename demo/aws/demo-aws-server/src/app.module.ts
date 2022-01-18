import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {AuthenticationModule} from '@perfect-stack/nestjs-server/dist';
import {ClientConfigModule} from '@perfect-stack/nestjs-server/dist/client/config/client-config.module';
import {OrmModule} from '@perfect-stack/nestjs-server/dist/orm/orm.module';
import {DataModule} from '@perfect-stack/nestjs-server/dist/data/data.module';
import {MetaPageModule} from '@perfect-stack/nestjs-server/dist/meta/meta-page/meta-page.module';
import {MetaMenuModule} from '@perfect-stack/nestjs-server/dist/meta/meta-menu/meta-menu.module';
import {MetaEntityModule} from '@perfect-stack/nestjs-server/dist/meta/meta-entity/meta-entity.module';
import {JwtAuthGuard} from '@perfect-stack/nestjs-server/dist/authentication/jwt-auth.guard';

@Module({
  imports: [
    AuthenticationModule,
    ClientConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OrmModule,
    MetaEntityModule,
    MetaMenuModule,
    MetaPageModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
