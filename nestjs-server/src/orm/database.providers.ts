import { Sequelize } from 'sequelize-typescript';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('OrmService');

export interface DatabaseSettings {
  databaseHost: string;
  databasePort: number;
  databaseUser: string;
  passwordProperty: string;
  passwordKey: string;
  databaseName: string;
}

/**
 * This is the function that loads all the ORM configuration and model definitions. It is called from the provider
 * factory below but also a "reload()" method in the OrmService so that model definitions can be redefined at
 * runtime.
 */
export const loadOrm = async (
  databaseSettings: DatabaseSettings,
): Promise<Sequelize> => {
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

  logger.log(
    `Database connection = ${databaseSettings.databaseHost}:${databaseSettings.databasePort}, ${databaseSettings.databaseUser}`,
  );

  const sequelize = new Sequelize({
    dialect: 'postgres',
    dialectModule: require('pg'),
    host: databaseSettings.databaseHost,
    port: databaseSettings.databasePort,
    username: databaseSettings.databaseUser,
    password: databasePassword,
    database: databaseSettings.databaseName,
    logging: true,
    logQueryParameters: true,
    ssl: true,
    pool: {
      /*
       * Lambda functions process one request at a time but your code may issue multiple queries
       * concurrently. Be wary that `sequelize` has methods that issue 2 queries concurrently
       * (e.g. `Model.findAndCountAll()`). Using a value higher than 1 allows concurrent queries to
       * be executed in parallel rather than serialized. Careful with executing too many queries in
       * parallel per Lambda function execution since that can bring down your database with an
       * excessive number of connections.
       *
       * Ideally you want to choose a `max` number where this holds true:
       * max * EXPECTED_MAX_CONCURRENT_LAMBDA_INVOCATIONS < MAX_ALLOWED_DATABASE_CONNECTIONS * 0.8
       */
      max: 4,
      /*
       * Set this value to 0 so connection pool eviction logic eventually cleans up all connections
       * in the event of a Lambda function timeout.
       */
      min: 0,
      /*
       * Set this value to 0 so connections are eligible for cleanup immediately after they're
       * returned to the pool.
       */
      idle: 0,
      // Choose a small enough value that fails fast if a connection takes too long to be established.
      acquire: 3000,
      /*
       * Ensures the connection pool attempts to be cleaned up automatically on the next Lambda
       * function invocation, if the previous invocation timed out.
       */
      evict: 30000, //CURRENT_LAMBDA_FUNCTION_TIMEOUT,
    },
  });
  // sequelize.addModels([]);
  // await sequelize.sync();

  // or sequalize.sync()
  await sequelize.authenticate();

  return sequelize;
};

let globalProviderSequelize: Sequelize = null;

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<Sequelize> => {
      logger.log('SEQUELIZE factory: started');
      if (globalProviderSequelize) {
        logger.log(
          'SEQUELIZE factory: detected globalProviderSequelize, using that',
        );
        return globalProviderSequelize;
      } else {
        logger.log(
          'SEQUELIZE factory: no globalProviderSequelize, will loadOrm()',
        );
        const databaseSettings: DatabaseSettings = {
          databaseHost: configService.get<string>('DATABASE_HOST'),
          databasePort: configService.get<number>('DATABASE_PORT'),
          databaseUser: configService.get<string>('DATABASE_USER'),
          passwordProperty: configService.get<string>('DATABASE_PASSWORD'),
          passwordKey: configService.get<string>('DATABASE_PASSWORD_KEY'),
          databaseName: configService.get<string>('DATABASE_NAME'),
        };

        globalProviderSequelize = await loadOrm(databaseSettings);
      }

      return globalProviderSequelize;
    },
  },
];
