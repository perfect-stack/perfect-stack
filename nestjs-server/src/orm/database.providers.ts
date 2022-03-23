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
  const databasePasswordProperty =
    configService.get<string>('DATABASE_PASSWORD');

  let databasePassword;
  if (databasePasswordProperty) {
    if (databasePasswordProperty.startsWith('arn:aws:secretsmanager:')) {
      const client = new SecretsManagerClient({
        region: 'ap-southeast-2',
      });

      const command = new GetSecretValueCommand({
        SecretId: 'dev/perfect-stack-demo',
      });
      const response = await client.send(command);
      const secret = JSON.parse(response.SecretString);
      databasePassword = secret['perfect-stack-demo-db'];
    } else {
      databasePassword = databasePasswordProperty;
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
    database: 'perfect-stack-demo-db',
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
