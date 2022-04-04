#!/usr/bin/env node
import 'source-map-support/register';
import { DemoAwsServerStack } from '../lib/demo-aws-server-stack';
import {DemoAwsClientStack} from '../lib/demo-aws-client-stack';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';

export interface EnvMap {
    CLIENT_RELEASE: string;
    SERVER_RELEASE: string;
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
}

export interface MyStackProps extends cdk.StackProps {
    envMap: EnvMap;
}


const loadEnvMap = (): EnvMap  => {
    if(!process.env.ENV_DIR) {
        throw new Error('ENV_DIR environment variable is not defined');
    }

    if(!process.env.ENV_NAME) {
        throw new Error('ENV_NAME environment variable is not defined');
    }

    const envFile = process.env.ENV_DIR + '/' + process.env.ENV_NAME + '.env';
    console.log(`envFile = ${envFile}`);

    const map = dotenv.config({
        path: envFile
    }).parsed;
    console.log(`envMap = ${JSON.stringify(map, null, 2)}`);

    return map as unknown as EnvMap;
}


const envMap = loadEnvMap();
const app = new cdk.App();

new DemoAwsServerStack(app, 'DemoAwsServerStack', {
    envMap: envMap
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
});

new DemoAwsClientStack(app, 'DemoAwsClientStack', {
    envMap: envMap
});