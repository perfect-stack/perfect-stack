import { Sequelize } from 'sequelize-typescript';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('OrmService');

/**
 * This is the function that loads all the ORM configuration and model definitions. It is called from the provider
 * factory below but also a "reload()" method in the OrmService so that model definitions can be redefined at
 * runtime.
 *
 * @param configService
 */
export const loadOrm = async (configService: ConfigService) => {
  const databaseHost = configService.get<string>('DATABASE_HOST');
  const databasePort = configService.get<number>('DATABASE_PORT');
  const databaseUser = configService.get<string>('DATABASE_USER');
  const passwordProperty = configService.get<string>('DATABASE_PASSWORD');
  const passwordKey = configService.get<string>('DATABASE_PASSWORD_KEY');
  const databaseName = configService.get<string>('DATABASE_NAME');

  let databasePassword;
  if (passwordProperty) {
    if (passwordProperty.startsWith('arn:aws:secretsmanager:')) {
      const client = new SecretsManagerClient({});
      const command = new GetSecretValueCommand({
        SecretId: passwordProperty,
      });
      const response = await client.send(command);
      const secret = JSON.parse(response.SecretString);
      databasePassword = secret[passwordKey];
    } else {
      databasePassword = passwordProperty;
    }
  } else {
    throw new Error('Database properties have not been initialised');
  }

  logger.log(
    `Database connection = ${databaseHost}:${databasePort}, ${databaseUser}`,
  );

  const sequelize = new Sequelize({
    dialect: 'postgres',
    dialectModule: require('pg'),
    host: databaseHost,
    port: databasePort,
    username: databaseUser,
    password: databasePassword,
    database: databaseName,
    logQueryParameters: false,
  });
  // sequelize.addModels([]);
  // await sequelize.sync();
  return sequelize;
};

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      return loadOrm(configService);
    },
  },
];
