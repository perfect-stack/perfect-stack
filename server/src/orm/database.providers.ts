import { Sequelize } from 'sequelize-typescript';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
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
        //host: 'localhost',
        host: 'perfect-stack-demo-db2.ctomh1fo55cy.us-east-1.rds.amazonaws.com',
        port: 5432,
        username: 'postgres',
        password: password,
        //password: 'Password01',
        database: 'perfect-stack-demo-db',
      });
      // sequelize.addModels([]);
      // await sequelize.sync();
      return sequelize;
    },
  },
];
