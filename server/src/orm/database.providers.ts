import { Sequelize } from 'sequelize-typescript';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { ConfigService } from '@nestjs/config';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const databaseHost = configService.get<string>('DATABASE_HOST');
      const databasePort = configService.get<number>('DATABASE_PORT');
      const databaseUser = configService.get<string>('DATABASE_USER');
      const databasePassword = configService.get<string>('DATABASE_PASSWORD');

      const client = new SecretsManagerClient({});
      const command = new GetSecretValueCommand({
        SecretId: 'dev/perfect-stack-demo',
      });
      const response = await client.send(command);
      const secret = JSON.parse(response.SecretString);
      const password = secret['perfect-stack-demo-db'];

      const sequelize = new Sequelize({
        dialect: 'postgres',
        dialectModule: require('pg'),
        // host: 'WeAreTheBorg.local',
        // host: 'localhost',
        // host: 'perfect-stack-demo-db.cwbt69xytp0e.ap-southeast-2.rds.amazonaws.com',
        //port: 5432,
        //username: 'postgres',
        //password: password,
        //password: 'Password01',

        host: databaseHost,
        port: databasePort,
        username: databaseUser,
        password: databasePassword,

        database: 'perfect-stack-demo-db',
      });
      // sequelize.addModels([]);
      // await sequelize.sync();
      return sequelize;
    },
  },
];
