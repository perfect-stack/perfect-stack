import { Injectable, Logger } from '@nestjs/common';
import { knex } from 'knex';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class KnexService {
  _knex;

  constructor(protected readonly settingsService: SettingsService) {}

  async getKnex(): Promise<any> {
    if (!this._knex) {
      const databaseSettings = await this.settingsService.getDatabaseSettings();

      this._knex = knex({
        client: 'pg',
        connection: {
          host: databaseSettings.databaseHost,
          port: databaseSettings.databasePort,
          user: databaseSettings.databaseUser,
          password: databaseSettings.databasePassword,
          database: databaseSettings.databaseName,
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
