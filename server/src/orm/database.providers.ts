import { Sequelize } from 'sequelize-typescript';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        //        host: 'WeAreTheBorg.local',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'Password01',
        database: 'perfect-stack-demo-db',
      });
      // sequelize.addModels([]);
      // await sequelize.sync();
      return sequelize;
    },
  },
];
