import {Sequelize} from 'sequelize-typescript';
import {
    GetSecretValueCommand,
    SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {ConfigService} from '@nestjs/config';
import {Logger} from '@nestjs/common';
import {Client} from 'pg';
import * as cls from 'cls-hooked';

// Setup for Sequelize Transactions (https://sequelize.org/docs/v6/other-topics/transactions/)
const CLS_NAMESPACE = cls.createNamespace('MY_CLS_NAMESPACE');
Sequelize.useCLS(CLS_NAMESPACE);

const logger = new Logger('OrmService');

export interface DatabaseSettings {
    databaseHost: string;
    databasePort: number;
    databaseUser: string;
    databasePassword: string; // resolved at runtime depending on passwordProperty
    passwordProperty: string;
    passwordKey: string;
    databaseName: string;
}

export const newSequelize = async (databasePassword: string, databaseSettings: DatabaseSettings) => {
    const sequelize = new Sequelize({
        dialect: 'postgres',
        dialectModule: require('pg'),
        host: databaseSettings.databaseHost,
        port: databaseSettings.databasePort,
        username: databaseSettings.databaseUser,
        password: databasePassword,
        database: databaseSettings.databaseName,
        // uncomment one of the following two logging options
        logging: false,
        //logging: (msg) => logger.log(msg),
        logQueryParameters: true,
        ssl: true,
        pool: {
            /*
             * Lambda functions process one request at a time but your code may issue multiple queries
             * concurrently. Be wary that `sequelize` has methods that issue 2 queries concurrently
             * (e.g. `Model.findAndCountAll()`). Using a value higher than 1 allows concurrent queries to
             * be executed in parallel rather than serialized. Careful with executing too many queries in
             * parallel per Lambda function execution since that can bring down your database with an
             * excessive number of connections.
             *
             * Ideally you want to choose a `max` number where this holds true:
             * max * EXPECTED_MAX_CONCURRENT_LAMBDA_INVOCATIONS < MAX_ALLOWED_DATABASE_CONNECTIONS * 0.8
             */
            max: 4,
            /*
             * Set this value to 0 so connection pool eviction logic eventually cleans up all connections
             * in the event of a Lambda function timeout.
             */
            min: 0,
            /*
             * Set this value to 0 so connections are eligible for cleanup immediately after they're
             * returned to the pool.
             */
            idle: 0,
            // Choose a small enough value that fails fast if a connection takes too long to be established.
            acquire: 3000,
            /*
             * Ensures the connection pool attempts to be cleaned up automatically on the next Lambda
             * function invocation, if the previous invocation timed out.
             */
            evict: 30000, //CURRENT_LAMBDA_FUNCTION_TIMEOUT,
        },
    });
    await sequelize.authenticate();
    return sequelize;
}

export const findPassword = async (databaseSettings: DatabaseSettings) => {
    let databasePassword;
    if (databaseSettings.passwordProperty) {
        if (databaseSettings.passwordProperty.startsWith('RAW:')) {
            databasePassword = databaseSettings.passwordProperty.substring('RAW:'.length);
        } else {
            const client = new SecretsManagerClient({});
            const command = new GetSecretValueCommand({
                SecretId: databaseSettings.passwordProperty,
            });

            const response = await client.send(command);
            const secret = JSON.parse(response.SecretString);
            databasePassword = secret[databaseSettings.passwordKey];
        }
    } else {
        throw new Error('Database properties have not been initialised');
    }
    return databasePassword;
}

/**
 * This method is called when a DB Snapshot has been restored from a different environment and so it will have a
 * different database name. For example if we restore a prod database into the dev environment it will have the name
 * of "prod_kims_db". So that all the other connection settings work (FME, Skyranger) we now need to rename the restored
 * database to have the right name.
 *
 * There should be only one database that matches the name "*kims_db" and if there is only one then we can attempt to
 * rename it.
 *
 * @param databasePassword
 * @param databaseSettings
 */
export const renameDatabase = async (
    databasePassword: string,
    databaseSettings: DatabaseSettings,
) => {
    const expectedDatabaseName = databaseSettings.databaseName;
    logger.log(`Attempting to find and rename a database to "${expectedDatabaseName}"`);

    // Connect to the 'postgres' database to perform administrative tasks
    const client = new Client({
        host: databaseSettings.databaseHost,
        port: databaseSettings.databasePort,
        user: databaseSettings.databaseUser,
        password: databasePassword,
        database: 'postgres', // Connect to the maintenance database
        ssl: true,
    });

    try {
        await client.connect();
        logger.log('Connected to the "postgres" database successfully.');

        // Query for databases that might be the one we want to rename
        const res = await client.query(
            "SELECT datname FROM pg_database WHERE datname LIKE '%_kims_db'",
        );

        if (res.rows.length === 1) {
            const foundName = res.rows[0].datname;
            logger.log(`Found one matching database: "${foundName}"`);

            if (foundName === expectedDatabaseName) {
                // This is an unexpected state. The initial connection to the target DB failed,
                // but we can see it exists. This might indicate a permissions issue or other problem.
                throw new Error(`Database "${expectedDatabaseName}" already exists but the initial connection failed. Cannot proceed with rename.`);
            }
            else {
                logger.log(`Renaming database "${foundName}" to "${expectedDatabaseName}"...`);
                // NOTE: We cannot use parameterised queries for identifiers like database names.
                // We have validated the names are from a trusted source (pg_database).
                await client.query(`ALTER DATABASE "${foundName}" RENAME TO "${expectedDatabaseName}"`);
                logger.log('Database rename successful.');
            }
        }
        else if (res.rows.length > 1) {
            const dbNames = res.rows.map((row) => row.datname).join(', ');
            throw new Error(`Found multiple databases matching '*_kims_db': ${dbNames}. Unsure how to proceed.`);
        }
        else {
            throw new Error("Did not find any database matching '*_kims_db' to rename.");
        }
    }
    finally {
        await client.end();
        logger.log('Disconnected from the "postgres" database.');
    }
};

/**
 * This is the function that loads all the ORM configuration and model definitions. It is called from the provider
 * factory below but also a "reload()" method in the OrmService so that model definitions can be redefined at
 * runtime.
 */
export const loadOrm = async (
    databaseSettings: DatabaseSettings,
): Promise<Sequelize> => {

    const databasePassword = await findPassword(databaseSettings);

    logger.log(`Database connection = ${databaseSettings.databaseHost}:${databaseSettings.databasePort}, ${databaseSettings.databaseUser}`);

    let sequelize;
    try {
        sequelize = await newSequelize(databasePassword, databaseSettings);
        return sequelize;
    }
    catch (e) {
        logger.error(`Error connecting to database: ${e.message}`)
        if (e.message.includes('kims_db') && e.message.includes('does not exist')) {
            await renameDatabase(databasePassword, databaseSettings);
            sequelize = await newSequelize(databasePassword, databaseSettings);
            return sequelize;
        }
        else {
            throw e;
        }
    }
};

// Global variable: to make lambdas faster..
let globalProviderSequelize: Sequelize = null;

export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        inject: [ConfigService],
        useFactory: async (configService: ConfigService): Promise<Sequelize> => {
            logger.log('SEQUELIZE factory: started');
            if (globalProviderSequelize) {
                logger.log('SEQUELIZE factory: detected globalProviderSequelize, using that');
                return globalProviderSequelize;
            } else {
                logger.log('SEQUELIZE factory: no globalProviderSequelize, will loadOrm()');

                const databaseSettings: DatabaseSettings = {
                    databaseHost: configService.get<string>('DATABASE_HOST'),
                    databasePort: configService.get<number>('DATABASE_PORT'),
                    databaseUser: configService.get<string>('DATABASE_USER'),
                    databasePassword: '',
                    passwordProperty: configService.get<string>('DATABASE_PASSWORD'),
                    passwordKey: configService.get<string>('DATABASE_PASSWORD_KEY'),
                    databaseName: configService.get<string>('DATABASE_NAME'),
                };

                globalProviderSequelize = await loadOrm(databaseSettings);
            }

            return globalProviderSequelize;
        },
    },
];
