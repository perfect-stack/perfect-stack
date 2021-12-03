import { Logger } from '@nestjs/common';
import { Options } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Person } from './domain/person';
import * as Process from 'process';

const logger = new Logger('MikroORM');
const config = {
  entities: [Person],
  dbName: 'perfect-stack-demo-db',
  type: 'postgresql',
  host: 'WeAreTheBorg.local',
  port: 5432,
  password: Process.env.PERFECT_STACK_DB_PASSWORD,
  highlighter: new SqlHighlighter(),
  debug: true,
  logger: logger.log.bind(logger),
} as Options;

export default config;
