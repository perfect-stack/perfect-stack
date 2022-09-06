import { Injectable } from '@nestjs/common';
import { DatabaseSettings } from '../orm/database.providers';
import { ConfigService } from '@nestjs/config';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SettingsService {
  constructor(protected readonly configService: ConfigService) {}

  async getDatabaseSettings(): Promise<DatabaseSettings> {
    const databaseSettings: DatabaseSettings = {
      databaseHost: this.configService.get<string>('DATABASE_HOST'),
      databasePort: this.configService.get<number>('DATABASE_PORT'),
      databaseUser: this.configService.get<string>('DATABASE_USER'),
      databasePassword: '',
      passwordProperty: this.configService.get<string>('DATABASE_PASSWORD'),
      passwordKey: this.configService.get<string>('DATABASE_PASSWORD_KEY'),
      databaseName: this.configService.get<string>('DATABASE_NAME'),
    };

    let databasePassword;
    if (databaseSettings.passwordProperty) {
      if (
        databaseSettings.passwordProperty.startsWith('arn:aws:secretsmanager:')
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

    databaseSettings.databasePassword = databasePassword;

    return databaseSettings;
  }
}
