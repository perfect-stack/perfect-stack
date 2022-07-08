import { Injectable } from '@nestjs/common';
import { knex } from 'knex';
import { ConfigService } from '@nestjs/config';
import { DatabaseSettings } from '../orm/database.providers';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

@Injectable()
export class KnexService {
  _knex;

  constructor(protected readonly configService: ConfigService) {}

  async getKnex(): Promise<any> {
    if (!this._knex) {
      const databaseSettings: DatabaseSettings = {
        databaseHost: this.configService.get<string>('DATABASE_HOST'),
        databasePort: this.configService.get<number>('DATABASE_PORT'),
        databaseUser: this.configService.get<string>('DATABASE_USER'),
        passwordProperty: this.configService.get<string>('DATABASE_PASSWORD'),
        passwordKey: this.configService.get<string>('DATABASE_PASSWORD_KEY'),
        databaseName: this.configService.get<string>('DATABASE_NAME'),
      };

      let databasePassword;
      if (databaseSettings.passwordProperty) {
        if (
          databaseSettings.passwordProperty.startsWith(
            'arn:aws:secretsmanager:',
          )
        ) {
          const client = new SecretsManagerClient({});
          const command = new GetSecretValueCommand({
            SecretId: databaseSettings.passwordProperty,
          });
          const response = await client.send(command);
          const secret = JSON.parse(response.SecretString);
          databasePassword = secret[databaseSettings.passwordKey];
        } else {
          databasePassword = databaseSettings.passwordProperty;
        }
      } else {
        throw new Error('Database properties have not been initialised');
      }

      this._knex = knex({
        client: 'pg',
        connection: {
          host: databaseSettings.databaseHost,
          port: databaseSettings.databasePort,
          user: databaseSettings.databaseUser,
          password: databasePassword,
          database: databaseSettings.databaseName,
        },
      });
    }

    return this._knex;
  }
}
