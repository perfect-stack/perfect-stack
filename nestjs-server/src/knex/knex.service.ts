import { Injectable } from '@nestjs/common';
import { knex } from 'knex';

@Injectable()
export class KnexService {
  knex;

  constructor() {
    this.knex = knex({
      client: 'pg',
      connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'Password01',
        database: 'perfect-stack-demo-db',
      },
    });
  }
}
