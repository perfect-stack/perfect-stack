import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { knex, Knex } from 'knex';
import { SettingsService } from '../settings/settings.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KnexService implements OnModuleInit {
  _knex: Knex;
  private readonly logger = new Logger(KnexService.name);

  constructor(
    protected readonly settingsService: SettingsService,
    protected readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('KnexModule is being initialized');
    await this.getKnex();
  }

  async getKnex(): Promise<Knex> {
    if (!this._knex) {
      const dialect = (
        this.configService.get<string>('DATABASE_DIALECT', 'postgres') ||
        'postgres'
      ).toLowerCase();

      switch (dialect) {
        case 'sqlite':
          this._knex = await this.createSqliteKnex();
          break;
        case 'postgres':
          this._knex = await this.createPostgresKnex();
          break;
        default:
          throw new Error(
            `Unsupported DATABASE_DIALECT: "${dialect}". Supported dialects are: 'postgres', 'sqlite'`,
          );
      }
    }

    return this._knex;
  }

  private async createSqliteKnex(): Promise<Knex> {
    const storage = this.configService.get<string>(
      'DATABASE_STORAGE',
      ':memory:',
    );
    this.logger.log(`Knex using SQLite storage: ${storage}`);

    const knexInstance = knex({
      client: 'sqlite3',
      connection: {
        filename: storage,
      },
      useNullAsDefault: true,
    });

    try {
      await knexInstance.raw('select 1+1 as result');
      this.logger.log('Knex SQLite connection established successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to establish Knex SQLite connection.',
        error.stack,
      );
      throw error;
    }

    return knexInstance;
  }

  private async createPostgresKnex(): Promise<Knex> {
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

    const knexInstance = knex({
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
      await knexInstance.raw('select 1+1 as result');
      this.logger.log('Knex connection established successfully.');
    } catch (error) {
      this.logger.error('Failed to establish Knex connection.', error.stack);
      throw error;
    }

    return knexInstance;
  }

  logQuery(logger: Logger, queryName: string, query: any) {
    const nativeQuery = query.toSQL().toNative();
    logger.log(`${queryName}.sql: ${nativeQuery.sql}`);
    logger.log(
      `${queryName}.bindings: ${JSON.stringify(nativeQuery.bindings)}`,
    );
  }
}
