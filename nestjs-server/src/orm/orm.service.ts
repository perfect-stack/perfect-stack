import { Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { databaseProviders } from './database.providers';

export class OrmService {
  constructor(
    @Inject('SEQUELIZE') public sequelize: Sequelize,
    protected readonly configService: ConfigService,
  ) {}

  async reload() {
    this.sequelize = await databaseProviders[0].useFactory(this.configService);
  }
}
