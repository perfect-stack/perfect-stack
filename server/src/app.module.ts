import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    AuthenticationModule,
    ConfigModule.forRoot(),
    OrmModule,
    MetaEntityModule,
    MetaMenuModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
