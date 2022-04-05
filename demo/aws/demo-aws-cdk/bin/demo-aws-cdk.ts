#!/usr/bin/env node
import 'source-map-support/register';
import { DemoAwsServerStack } from '../lib/demo-aws-server-stack';
import {DemoAwsClientStack} from '../lib/demo-aws-client-stack';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export interface ClientEnvMap {
    CLIENT_RELEASE: string;
    API_URL: string;
}

export interface ServerEnvMap {
    SERVER_RELEASE: string;
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
}

export interface MyStackProps extends cdk.StackProps {
    clientEnvMap: ClientEnvMap;
    serverEnvMap: ServerEnvMap;

    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */

    /* Uncomment the next line to specialize this stack for the AWS Account
     * and Region that are implied by the current CLI configuration. */
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

    /* Uncomment the next line if you know exactly what Account and Region you
     * want to deploy the stack to. */
    // env: { account: '123456789012', region: 'us-east-1' },

    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
}


const loadMyStackProps = (): MyStackProps  => {
    if(!process.env.ENV_HOME) {
        throw new Error('ENV_HOME environment variable is not defined');
    }

    if(!process.env.ENV_NAME) {
        throw new Error('ENV_NAME environment variable is not defined');
    }

    const envDir = process.env.ENV_HOME + '/' + process.env.ENV_NAME + '/';

    const rawClientJson = fs.readFileSync(envDir + 'client.json').toString();
    const clientEnvMap = JSON.parse(rawClientJson);

    const myStackProps: MyStackProps = {
        clientEnvMap: clientEnvMap as unknown as ClientEnvMap,
        serverEnvMap: dotenv.config({path: envDir + 'server.env'}).parsed as unknown as ServerEnvMap,
    }

    console.log(`envMap = ${JSON.stringify(myStackProps, null, 2)}`);

    return myStackProps;
}


const myStackProps = loadMyStackProps();
const app = new cdk.App();

new DemoAwsServerStack(app, 'DemoAwsServerStack', myStackProps);
new DemoAwsClientStack(app, 'DemoAwsClientStack', myStackProps);

