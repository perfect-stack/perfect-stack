import {Inject, Logger} from '@nestjs/common';
import {Sequelize} from 'sequelize';
import {ConfigService} from '@nestjs/config';
import {databaseProviders} from './database.providers';

export class OrmService {

    private logger = new Logger(OrmService.name);

    constructor(
        @Inject('SEQUELIZE') public sequelize: Sequelize,
        protected readonly configService: ConfigService,
    ) {
    }

    async reload() {
        try {
            this.sequelize = await databaseProviders[0].useFactory(this.configService);
        } catch (e) {
            this.logger.error(e.message, e.stack);
            throw e;
        }
    }
}
