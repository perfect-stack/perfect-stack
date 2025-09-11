import {BatchJob} from "@perfect-stack/nestjs-server";
import {ConfigService} from "@nestjs/config";
import {Inject, Injectable, Logger} from "@nestjs/common";
import {
    CreateDBClusterSnapshotCommand,
    DescribeDBClusterSnapshotsCommand,
    ModifyDBClusterSnapshotAttributeCommand,
    RDSClient
} from "@aws-sdk/client-rds";
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
        const snapshotIdentifier = `${clusterEnvName}-snapshot-${Date.now()}`;

        await this.createSnapshot(dbClusterIdentifier, snapshotIdentifier);

        // Don't await this. Let it run in the background.
        void (async () => {
            try {
                this.logger.log(`Starting background process for snapshot: ${snapshotIdentifier}`);
                await this.waitForSnapshotAvailable(snapshotIdentifier);
                await this.shareSnapshot(snapshotIdentifier);
                this.logger.log(`Background process finished for snapshot: ${snapshotIdentifier}`);
            } catch (error) {
                this.logger.error(`Error in background snapshot process for ${snapshotIdentifier}:`, error.stack);
            }
        })();

        return this.getSummary();
    }

    private async createSnapshot(dbClusterIdentifier: string, snapshotIdentifier: string) {
        this.logger.log(`Creating snapshot: ${snapshotIdentifier} for cluster: ${dbClusterIdentifier}`);

        const command = new CreateDBClusterSnapshotCommand({
            DBClusterIdentifier: dbClusterIdentifier,
            DBClusterSnapshotIdentifier: snapshotIdentifier,
        });

        const createSnapshotResponse = await this.rdsClient.send(command);
        this.logger.log(`Successfully initiated snapshot creation for cluster: ${dbClusterIdentifier}. Snapshot ARN: ${createSnapshotResponse.DBClusterSnapshot.DBClusterSnapshotArn}`);
    }

    private async waitForSnapshotAvailable(snapshotIdentifier: string, timeoutSeconds = 600, pollIntervalSeconds = 20): Promise<void> {
        const startTime = Date.now();
        const timeout = startTime + timeoutSeconds * 1000;

        while (Date.now() < timeout) {
            const command = new DescribeDBClusterSnapshotsCommand({
                DBClusterSnapshotIdentifier: snapshotIdentifier,
            });
            const response = await this.rdsClient.send(command);

            if (response.DBClusterSnapshots && response.DBClusterSnapshots.length > 0) {
                const snapshot = response.DBClusterSnapshots[0];
                this.logger.log(`Current status of snapshot ${snapshotIdentifier} is ${snapshot.Status}`);
                if (snapshot.Status === 'available') {
                    return;
                } else if (['failed', 'incompatible-restore', 'incompatible-parameters'].includes(snapshot.Status)) {
                    throw new Error(`Snapshot ${snapshotIdentifier} entered a failed state: ${snapshot.Status}`);
                }
            }

            await new Promise(resolve => setTimeout(resolve, pollIntervalSeconds * 1000));
        }

        throw new Error(`Timeout waiting for snapshot ${snapshotIdentifier} to become available.`);
    }

    private async shareSnapshot(snapshotIdentifier: string) {
        const accountIdsToShareWith = this.configService.get('DATABASE_SNAPSHOT_SHARING', '').split(',').filter(id => id);
        if (accountIdsToShareWith.length > 0) {
            this.logger.log(`Sharing snapshot ${snapshotIdentifier} with accounts: ${accountIdsToShareWith.join(', ')}`);
            const modifyCommand = new ModifyDBClusterSnapshotAttributeCommand({
                DBClusterSnapshotIdentifier: snapshotIdentifier,
                AttributeName: 'restore',
                ValuesToAdd: accountIdsToShareWith,
            });

            await this.rdsClient.send(modifyCommand);
            this.logger.log(`Successfully shared snapshot ${snapshotIdentifier}.`);
        }
    }


    async getSummary(): Promise<any> {
        const envName = this.getEnvironmentName();
        this.logger.log(`GetSummary DbSnapshotBatchjob for env: ${envName}`);

        const clusterEnvName = envName === 'ENV_NAME' ? 'dev' : envName;
        const dbClusterIdentifier = `${clusterEnvName}-kims-database-cluster`;

        const command = new DescribeDBClusterSnapshotsCommand({
            DBClusterIdentifier: dbClusterIdentifier,
        });

        const response = await this.rdsClient.send(command);

        const snapshots = response.DBClusterSnapshots
            .sort((a, b) => b.SnapshotCreateTime.getTime() - a.SnapshotCreateTime.getTime())
            .map(snapshot => {
            return {
                snapshotName: snapshot.DBClusterSnapshotIdentifier,
                creationTime: snapshot.SnapshotCreateTime,
                status: snapshot.Status,
                arn: snapshot.DBClusterSnapshotArn,
            };
        });

        return snapshots;
    }
}