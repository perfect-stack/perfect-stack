import {Provider} from '@nestjs/common';
import {RDSClient} from '@aws-sdk/client-rds';
import {ConfigService} from '@nestjs/config';

export const RDS_CLIENT = Symbol('RDS_CLIENT');

export const RdsProvider: Provider = {
    provide: RDS_CLIENT,
    useFactory: (configService: ConfigService) => {
        const region = configService.get('AWS_REGION');
        return new RDSClient({region});
    },
    inject: [ConfigService],
};