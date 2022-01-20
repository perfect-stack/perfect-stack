#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DemoAwsServerStack } from '../lib/demo-aws-server-stack';
import {DemoAwsClientStack} from '../lib/demo-aws-client-stack';
import * as dotenv from 'dotenv';


const loadEnvMap = ()  => {
    if(!process.env.NESTJS_ENV) {
        throw new Error('NESTJS_ENV environment variable is not defined');
    }

    console.log(`NESTJS_ENV = ${process.env.NESTJS_ENV}`);
    const envMap = dotenv.config({
        path: process.env.NESTJS_ENV
    });
    console.log(`envMap = ${JSON.stringify(envMap.parsed, null, 2)}`);

    return envMap;
}

export interface MyStackProps extends cdk.StackProps {
    envMap: any;
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