import {BatchJob} from "@perfect-stack/nestjs-server";
import {ConfigService} from "@nestjs/config";
import {Inject, Injectable, Logger} from "@nestjs/common";
import {CreateDBClusterSnapshotCommand, RDSClient} from "@aws-sdk/client-rds";
import {RDS_CLIENT} from "./rds.provider";


@Injectable()
export class DbSnapshotBatchjob implements BatchJob {

    private logger = new Logger(DbSnapshotBatchjob.name);

    constructor(
        protected readonly configService: ConfigService,
        @Inject(RDS_CLIENT) protected readonly rdsClient: RDSClient,
    ) {}

    private getEnvironmentName() {
        return this.configService.get('ENV_NAME', 'ENV_NAME');
    }

    async execute(): Promise<any> {
        const envName = this.getEnvironmentName();
        this.logger.log(`Execute DbSnapshotBatchjob for env: ${envName}`);

        // If ENV_NAME not defined, then assume we are doing local development and have logged into the Dev environment
        const clusterEnvName = envName === 'ENV_NAME' ? 'dev' : envName;
        const dbClusterIdentifier = `${clusterEnvName}-kims-database-cluster`;

        const snapshotIdentifier = `snapshot-${dbClusterIdentifier}-${Date.now()}`;
        this.logger.log(`Creating snapshot: ${snapshotIdentifier} for cluster: ${dbClusterIdentifier}`);

        const command = new CreateDBClusterSnapshotCommand({
            DBClusterIdentifier: dbClusterIdentifier,
            DBClusterSnapshotIdentifier: snapshotIdentifier,
        });

        const response = await this.rdsClient.send(command);
        this.logger.log(`Successfully initiated snapshot creation for cluster: ${dbClusterIdentifier}.`);
        return response.DBClusterSnapshot;
    }

    getSummary(): Promise<any> {
        this.logger.log(`GetSummary DbSnapshotBatchjob for env: ${this.getEnvironmentName()}`);
        return Promise.resolve(undefined);
    }
}