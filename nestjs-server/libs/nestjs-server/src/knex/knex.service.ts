import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { knex } from 'knex';
import { SettingsService } from '../settings/settings.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KnexService implements OnModuleInit {
  _knex;
  private readonly logger = new Logger(KnexService.name);

  constructor(
    protected readonly settingsService: SettingsService,
    protected readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('KnexModule is being initialized');
    await this.getKnex();
  }

  async getKnex(): Promise<any> {
    if (!this._knex) {
      const databaseSettings = await this.settingsService.getDatabaseSettings();

      const min = parseInt(
        this.configService.get('DATABASE_POOL_KNEX_MIN', '2'),
        10,
      );
      const max = parseInt(
        this.configService.get('DATABASE_POOL_KNEX_MAX', '10'),
        10,
      );
      this.logger.log(`Knex pool settings; min: ${min}, max: ${max}`);

      this._knex = knex({
        client: 'pg',
        connection: {
          host: databaseSettings.databaseHost,
          port: databaseSettings.databasePort,
          user: databaseSettings.databaseUser,
          password: databaseSettings.databasePassword,
          database: databaseSettings.databaseName,
        },
        pool: {
          min: min,
          max: max,
        },
      });

      try {
        await this._knex.raw('select 1+1 as result');
        this.logger.log('Knex connection established successfully.');
      } catch (error) {
        this.logger.error('Failed to establish Knex connection.', error.stack);
        throw error;
      }
    }

    return this._knex;
  }

  logQuery(logger: Logger, queryName: string, query: any) {
    const nativeQuery = query.toSQL().toNative();
    logger.log(`${queryName}.sql: ${nativeQuery.sql}`);
    logger.log(
      `${queryName}.bindings: ${JSON.stringify(nativeQuery.bindings)}`,
    );
  }
}
