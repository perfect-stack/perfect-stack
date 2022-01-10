import { Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize';

export class OrmService {
  constructor(@Inject('SEQUELIZE') public readonly sequelize: Sequelize) {}
}
