import * as csv from 'fast-csv';
import * as uuid from 'uuid';
import {Pool, PoolClient} from 'pg';
import {Injectable} from "@nestjs/common";
import {AttributeType, MetaAttribute, MetaEntity} from "../domain/meta.entity";
import {MetaEntityService} from "../meta/meta-entity/meta-entity.service";
import * as path from "node:path";
import * as fs from "node:fs";
import {ConfigService} from "@nestjs/config";

// --- Configuration ---
const CSV_DIRECTORY = '/Users/richardperfect/dev/perfect-consulting/data-migration/data-migration-2025-05-21.1';
const BATCH_SIZE = 100; // Number of rows to insert in a single batch query

const filesToProcess: FileProcessingConfig[] = [
    {
        fileName: 'MGN_KIMS__AUDIT_.csv',
        tableName: 'Audit',
    },
    {
        fileName: 'MGN_KIMS__Authentication_.csv',
        tableName: 'Authentication',
    },
    {
        fileName: 'MGN_KIMS__LOCATION_TYPE_.csv',
        tableName: 'LocationType',
    },
    {
        fileName: 'MGN_KIMS__ORGANISATION_.csv',
        tableName: 'Organisation',
    },
    {
        fileName: 'MGN_KIMS__SPECIES_.csv',
        tableName: 'Species',
    },
    {
        fileName: 'MGN_KIMS__PERSON_.csv',
        tableName: 'Person',
    },
    {
        fileName: 'MGN_KIMS__LOCATION_.csv',
        tableName: 'Location',
    },
    {
        fileName: 'MGN_KIMS__BIRD_.csv',
        tableName: 'Bird',
    },
    {
        fileName: 'MGN_KIMS__EVENT_.csv',
        tableName: 'Event',
    },
    {
        fileName: 'MGN_KIMS__OBSERVER_ROLE_.csv',
        tableName: 'ObserverRole',
    },
    {
        fileName: 'MGN_KIMS__EVENT_OBSERVER_.csv',
        tableName: 'EventObserver',
    },
    {
        fileName: 'MGN_KIMS__ACTIVITY_TYPE_.csv',
        tableName: 'ActivityType',
    },
    {
        fileName: 'MGN_KIMS__BANDING_ACTIVITY_.csv',
        tableName: 'BandingActivity',
    },
    {
        fileName: 'MGN_KIMS__COUNT_TYPE_.csv',
        tableName: 'CountType',
    },
    {
        fileName: 'MGN_KIMS__CALL_COUNT_ACTIVITY_.csv',
        tableName: 'CallCountActivity',
    },
    {
        fileName: 'MGN_KIMS__CALL_INSTANCE_.csv',
        tableName: 'CallInstance',
    },
    {
        fileName: 'MGN_KIMS__DEATH_ACTIVITY_.csv',
        tableName: 'DeathActivity',
    },
    {
        fileName: 'MGN_KIMS__PREDATOR_DNA_.csv',
        tableName: 'PredatorDNA',
    },
    {
        fileName: 'MGN_KIMS__HEALTH_ACTIVITY_.csv',
        tableName: 'HealthActivity',
    },
    {
        fileName: 'MGN_KIMS__MEASUREMENT_ACTIVITY_.csv',
        tableName: 'MeasurementActivity',
    },
    {
        fileName: 'MGN_KIMS__MICROCHIP_ACTIVITY_.csv',
        tableName: 'MicrochipActivity',
    },
    {
        fileName: 'MGN_KIMS__WEATHER_ACTIVITY_.csv',
        tableName: 'WeatherActivity',
    },
    {
        fileName: 'MGN_KIMS__WEIGHT_ACTIVITY_.csv',
        tableName: 'WeightActivity',
    },
    {
        fileName: 'MGN_KIMS__HABITAT_TYPE_.csv',
        tableName: 'HabitatType',
    },
    {
        fileName: 'MGN_KIMS__PROJECT_STATUS_.csv',
        tableName: 'ProjectStatus',
    },
    {
        fileName: 'MGN_KIMS__PROJECT_TEAM_STATUS_.csv',
        tableName: 'ProjectTeamStatus',
    },
    {
        fileName: 'MGN_KIMS__PROJECT_ROLE_.csv',
        tableName: 'ProjectRole',
    },
    {
        fileName: 'MGN_KIMS__PROJECT_.csv',
        tableName: 'Project',
    },
    {
        fileName: 'MGN_KIMS__PROJECT_BIRD_.csv',
        tableName: 'ProjectBird',
    },
    {
        fileName: 'MGN_KIMS__PROJECT_MEMBER_.csv',
        tableName: 'ProjectMember',
    },
];

const ignoreForNow = [
    "Location.REGION",
    "Bird.FATE",
    "Event.activities",
    "EventObserver.INSTRUMENT_ID",
];





@Injectable()
export class MigrateService {

    constructor(protected readonly metaEntityService: MetaEntityService,
                protected readonly configService: ConfigService) {}

    async migrateData() {
        console.log('==== Migrate Data STARTED ======');
        await this.main();
        console.log('==== Migrate Data FINISHED ======');
        return;
    }

    async insertBatch(
        client: PoolClient,
        tableName: string,
        columns: string[],
        batch: any[][]
    ): Promise<void> {
        if (batch.length === 0 || columns.length === 0) {
            return;
        }

        const valuePlaceholders: string[] = [];
        const flatValues: any[] = [];
        let paramCount = 1;

        batch.forEach((rowValues) => {
            if (rowValues.length !== columns.length) {
                // This should ideally be caught earlier or handled by processRow consistently
                console.error(`Row value count (${rowValues.length}) does not match column count (${columns.length}) for table ${tableName}. Row: ${JSON.stringify(rowValues)}`);
                // Decide to skip row or throw error. For now, skipping this specific row in batch.
                return;
            }
            const placeholdersForOneRow = rowValues.map(() => `$${paramCount++}`);
            valuePlaceholders.push(`(${placeholdersForOneRow.join(', ')})`);
            flatValues.push(...rowValues);
        });

        if (flatValues.length === 0) return; // All rows in batch might have been skipped

        // Ensure table and column names are quoted to handle special characters or reserved words
        const quotedTableName = `"${tableName}"`;
        const quotedColumns = columns.map(col => `"${col}"`).join(', ');

        const queryText = `INSERT INTO ${quotedTableName} (${quotedColumns}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`;
        // ON CONFLICT DO NOTHING: If a row violates a unique constraint, it's skipped.
        // You might want:
        // ON CONFLICT (your_constraint_column) DO UPDATE SET ...
        // Or remove ON CONFLICT to let errors propagate.

        try {
            await client.query(queryText, flatValues);
        } catch (error) {
            console.error(`Error inserting batch into ${tableName}:`, error);
            console.error('Query:', queryText);
            console.error('First few values:', flatValues.slice(0, columns.length * 2)); // Log first few values for debugging
            throw error; // Re-throw to be caught by the file processor's transaction handling
        }
    }

    async processCsvFile(
        dbPool: Pool,
        filePath: string,
        tableName: string,
        rowProcessor: RowProcessor
    ): Promise<number> {
        return new Promise(async (resolve, reject) => {
            console.log(`[${tableName}] Starting processing for ${filePath}`);

            const client = await dbPool.connect();
            try {
                try {
                    console.log(`[${tableName}] Truncating table before import...`);
                    await client.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`); // Or DELETE FROM "${tableName}";
                    console.log(`[${tableName}] Table truncated.`);
                } catch (truncateError) {
                    console.error(`[${tableName}] Error truncating table:`, truncateError);
                    client.release();
                    reject(truncateError);
                    return; // Stop processing this file
                }

                // Disable FK checks and other user triggers for this session's operations
                await client.query(`SET session_replication_role = 'replica';`);
                console.log(`[${tableName}] Session replication role set to 'replica' to bypass triggers.`);

                let csvHeadersInternal: string[] | undefined;
                let dbColumnNamesForInsert: string[] | undefined; // Determined by the first successfully processed row
                let rowsBatch: any[][] = [];
                let processedRowCount = 0;

                await client.query('BEGIN');

                const stream = fs.createReadStream(filePath)
                    .pipe(csv.parse({headers: true, ignoreEmpty: true, trim: true}))
                    .on('error', async (error) => {
                        console.error(`[${tableName}] Error parsing CSV ${filePath}:`, error);
                        try {
                            await client.query('ROLLBACK');
                        } catch (rbErr) {
                            console.error(`[${tableName}] Rollback error on parse error:`, rbErr);
                        }
                        client.release();
                        reject(error);
                    })
                    .on('headers', (headers: string[]) => {
                        csvHeadersInternal = headers;
                        console.log(`[${tableName}] CSV Headers: ${headers.join(', ')}`);
                    })
                    .on('data', async (csvRow: { [key: string]: string }) => {
                        if (!csvHeadersInternal) {
                            // This should not happen if 'headers' event fires first
                            console.error(`[${tableName}] Headers not available for row:`, csvRow);
                            stream.destroy(new Error('CSV headers not processed before data.'));
                            return;
                        }

                        const processedData = rowProcessor(csvRow, csvHeadersInternal);

                        if (processedData) {
                            if (!dbColumnNamesForInsert) {
                                // Set the DB column names from the first successfully processed row
                                dbColumnNamesForInsert = processedData.columns;
                                if (dbColumnNamesForInsert.length === 0) {
                                    stream.destroy(new Error(`[${tableName}] Row processor returned no DB columns for the first valid row.`));
                                    return;
                                }
                                console.log(`[${tableName}] Determined DB columns for insert: ${dbColumnNamesForInsert.join(', ')}`);
                            }

                            // Ensure consistency of columns for all rows in the batch
                            if (JSON.stringify(processedData.columns) !== JSON.stringify(dbColumnNamesForInsert)) {
                                stream.destroy(new Error(`[${tableName}] Inconsistent DB columns returned by rowProcessor. Expected ${dbColumnNamesForInsert.join(', ')} but got ${processedData.columns.join(', ')} for row: ${JSON.stringify(csvRow)}`));
                                return;
                            }

                            rowsBatch.push(processedData.values);
                            processedRowCount++;
                        }

                        if (rowsBatch.length >= BATCH_SIZE) {
                            stream.pause();
                            try {
                                if (dbColumnNamesForInsert && dbColumnNamesForInsert.length > 0) {
                                    await this.insertBatch(client, tableName, dbColumnNamesForInsert, rowsBatch);
                                    // console.log(`[${tableName}] Inserted batch of ${rowsBatch.length}`);
                                }
                                rowsBatch = []; // Clear batch
                            } catch (dbError) {
                                stream.destroy(dbError as Error); // Triggers 'error' event on stream
                                return; // Stop processing after destroy
                            } finally {
                                if (!stream.destroyed) {
                                    stream.resume();
                                }
                            }
                        }
                    })
                    .on('end', async (totalCsvRowCount: number) => {
                        if (stream.destroyed) {
                            // Error occurred, rollback and release already handled in 'error' event
                            return;
                        }
                        try {
                            if (rowsBatch.length > 0 && dbColumnNamesForInsert && dbColumnNamesForInsert.length > 0) {
                                await this.insertBatch(client, tableName, dbColumnNamesForInsert, rowsBatch);
                                // console.log(`[${tableName}] Inserted final batch of ${rowsBatch.length}`);
                            }
                            await client.query('COMMIT');
                            console.log(`[${tableName}] Successfully processed and committed ${processedRowCount} (out of ${totalCsvRowCount} CSV rows) from ${filePath}`);
                            resolve(processedRowCount);
                        } catch (endError) {
                            console.error(`[${tableName}] Error during final batch insert or commit:`, endError);
                            try {
                                await client.query('ROLLBACK');
                            } catch (rbErr) {
                                console.error(`[${tableName}] Rollback error on end error:`, rbErr);
                            }
                            reject(endError);
                        } finally {
                            client.release();
                        }
                    });
            } catch (initialError) {
                console.error(`[${tableName}] Initial setup error for ${filePath}:`, initialError);
                if (client) client.release(); // Ensure client is released if connected
                reject(initialError);
            }
        });
    }


    async main() {

        const databaseSettings = {
            databaseHost: this.configService.get<string>('DATABASE_HOST'),
            databasePort: this.configService.get<number>('DATABASE_PORT'),
            databaseUser: this.configService.get<string>('DATABASE_USER'),
            databasePassword: this.configService.get<string>('DATABASE_PASSWORD'), // TODO: this is not AWS compatible because not integrated with Secrets Manager
            databaseName: this.configService.get<string>('DATABASE_NAME'),
        };

        const pool = new Pool({
            // Example connection (prefer environment variables for security)
            user: databaseSettings.databaseUser,
            host: databaseSettings.databaseHost,
            database: databaseSettings.databaseName,
            password: databaseSettings.databasePassword,
            port: databaseSettings.databasePort,
        });


        try {
            console.log('Starting CSV data import process...');

            for(const config of filesToProcess) {
                const metaEntity = await this.metaEntityService.findOne(config.tableName);
                if(metaEntity) {
                    config.metaEntity = metaEntity;
                    config.processRow = new MetaEntityRowProcessor(metaEntity).processRow;
                }
                else {
                    throw new Error("Unable to find MetaEntity for table: " + config.tableName);
                }
            }

            for (const config of filesToProcess) {
                const filePath = path.join(CSV_DIRECTORY, config.fileName);
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found: ${filePath}.`);
                }

                try {
                    await this.processCsvFile(pool, filePath, config.tableName, config.processRow);
                    console.log(`Successfully imported data from ${config.fileName} into ${config.tableName}`);
                } catch (error) {
                    console.error(`Failed to process file ${config.fileName}:`, error);
                    console.error('Stopping import process due to error.');
                    // Decide if you want to stop on first error or continue with other files
                    break; // Stop on first error
                }
            }

            await pool.end(); // Close all connections in the pool
            console.log('Data import process finished.');
        }
        catch (error) {
            console.error('Unhandled error in main process:', error);
            pool.end(); // Ensure pool is closed on unhandled main error
        }
    }
}




// --- Helper: Row Processor Function Type ---
// Takes a CSV row (object with CSV headers as keys) and the original CSV headers.
// Returns an object { columns: string[], values: any[] } for DB insertion,
// where 'columns' are the DB column names and 'values' are the corresponding values.
// Return null to skip a row.
type RowProcessor = (
    csvRow: { [key: string]: string },
    csvHeaders: string[]
) => { columns: string[]; values: any[] } | null;

// --- File Processing Configuration ---
interface FileProcessingConfig {
    fileName: string;
    tableName: string;
    metaEntity?: MetaEntity;
    processRow?: RowProcessor; // Custom function to transform/map CSV row to DB row
}

// --- BEGIN: Define your Row Processors Here ---
// Replace these examples with your actual transformation logic.

class MetaEntityRowProcessor {

    constructor(private readonly metaEntity: MetaEntity) {}

    private processValue(attribute: MetaAttribute, value: string, csvRow: { [key: string]: string }): any {
        // If value is empty string then convert to a null
        if(value === '') {
            value = null;
        }

        if(attribute.type === AttributeType.Identifier) {
            if(value === null || !uuid.validate(value)) {
                const fullAttributeName = this.metaEntity.name + "." + attribute.name;
                throw new Error("Unable to convert value of " + value + " to a valid UUID for " + fullAttributeName );
            }
        }

        // If attribute is numeric convert to a number...
        // If attribute is a date convert to a date...

        // if(attribute.name === 'health_notes' && value !== null) {
        //     console.log(`${csvRow['EVENT_ID']} health_notes: ${value}`);
        // }

        return value;
    }

    public readonly processRow: RowProcessor = (
        csvRow: { [key: string]: string },
        csvHeaders: string[]
    ): { columns: string[]; values: any[] } | null => {
        const idValid = uuid.validate(csvRow['ID']);
        if (!idValid) {
            console.warn(`Skipping ${this.metaEntity.name} row due to invalid ID:`, csvRow);
            return null;
        }

        const columns: string[] = [];
        const values: any[] = [];

        // create a map of the column names from csvRow so that can track which ones we don't find
        let csvRowKeys = Object.keys(csvRow);

        ignoreForNow.forEach(ignore => {
            const tokens = ignore.split('.');
            const entityName = tokens[0];
            const csvColName = tokens[1].toUpperCase(); // if we ignore the attribute then need to remove it from the CSV col check too
            if(this.metaEntity.name === entityName) {
                csvRowKeys = csvRowKeys.filter(key => key !== csvColName);
            }
        });


        for (const attribute of this.metaEntity.attributes) {

            const fullAttributeName = this.metaEntity.name + "." + attribute.name;
            const isRelation = attribute.type === AttributeType.OneToMany;
            if(ignoreForNow.includes(fullAttributeName) || isRelation) {
                continue;
            }

            let csvColName = attribute.name.toUpperCase();
            if (!(csvColName in csvRow)) {
                csvColName = csvColName + '_ID';

                if (!(csvColName in csvRow)) {
                    throw new Error("Unable to find column for csvColName of " + csvColName + " and " + fullAttributeName + " attribute: " + JSON.stringify(attribute) );
                }
            }

            const dbColName = csvColName.toLowerCase();
            csvRowKeys = csvRowKeys.filter(key => key !== csvColName);

            const csvValue = csvRow[csvColName];
            const dbValue = this.processValue(attribute, csvValue, csvRow);

            // if(this.metaEntity.name === 'HealthActivity' && attribute.name === 'activity_type' && dbValue === 'Health') {
            //     console.log(`${csvRow['EVENT_ID']} : ${dbValue}`);
            // }

            columns.push(dbColName);
            values.push(dbValue);
        }

        if(this.metaEntity.timestamps) {
            columns.push('created_at');
            columns.push('updated_at');

            const createdAt = csvRow['CREATED_AT'];
            const updatedAt = csvRow['UPDATED_AT'];

            if(createdAt === null || createdAt === '') {
                throw new Error("In file for " + this.metaEntity.name + " Unable to find CREATED_AT value for " + this.metaEntity.name + " at row; " + JSON.stringify(csvRow) );
            }

            if(updatedAt === null || updatedAt === '') {
                throw new Error("In file for " + this.metaEntity.name + " Unable to find UPDATED_AT value for " + this.metaEntity.name + " at row; " + JSON.stringify(csvRow) );
            }

            values.push(createdAt);
            values.push(updatedAt);

            csvRowKeys = csvRowKeys.filter(key => key !== 'CREATED_AT');
            csvRowKeys = csvRowKeys.filter(key => key !== 'UPDATED_AT');
        }

        // Any leftover CSV column names are probably FK for parents of this child (e.g EVENT_ID of EVENT_OBSERVER)
        // But let's check that and only process them if they end in "_ID" and we can't find the meta entity for the name
        for(const csvColName of csvRowKeys) {
            const idSuffix = "_ID";
            if(csvColName.endsWith(idSuffix)) {
                const entityName = csvColName.substring(0, csvColName.length - idSuffix.length);
                if(["EVENT", "DEATH_ACTIVITY"].includes(entityName)) {
                    columns.push(csvColName.toLowerCase());
                    values.push(csvRow[csvColName]);
                    csvRowKeys = csvRowKeys.filter(key => key !== csvColName);
                }
            }
        }

        if(csvRowKeys.length > 0) {
            throw new Error("Unable to find attributes for one or more columns: " + csvRowKeys.join(', ') + " of entity " + this.metaEntity.name );
        }

        return {
            columns: [...columns],
            values: [...values],
        };
    };
}


// --- END: Define your Row Processors Here ---



