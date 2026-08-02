import { Injectable, Logger } from '@nestjs/common';
import { knex } from 'knex';
import { SettingsService } from '../settings/settings.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KnexService {
  _knex;

  constructor(
    protected readonly settingsService: SettingsService,
    protected readonly configService: ConfigService,
  ) {}

  async getKnex(): Promise<any> {
    if (!this._knex) {
      const databaseSettings = await this.settingsService.getDatabaseSettings();

      const min = parseInt(this.configService.get('DATABASE_POOL_KNEX_MIN', '2'), 10);
      const max = parseInt(this.configService.get('DATABASE_POOL_KNEX_MAX', '10'), 10);

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
