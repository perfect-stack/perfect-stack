import { Sequelize } from 'sequelize-typescript';
import { Person } from './domain/person';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: 'WeAreTheBorg.local',
        port: 5432,
        username: 'postgres',
        password: 'Password01',
        database: 'perfect-stack-demo-db',
      });
      sequelize.addModels([Person]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
