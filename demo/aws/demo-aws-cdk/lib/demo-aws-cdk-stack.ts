import * as dotenv from 'dotenv';
import * as cdk from 'aws-cdk-lib';
import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Effect} from 'aws-cdk-lib/aws-iam';


export class DemoAwsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    if(!process.env.NESTJS_ENV) {
      throw new Error('NESTJS_ENV environment variable is not defined');
    }

    console.log(`NESTJS_ENV = ${process.env.NESTJS_ENV}`);
    const envMap = dotenv.config({
      path: process.env.NESTJS_ENV
    });
    console.log(`envMap = ${JSON.stringify(envMap.parsed)}`);

    const repo = cdk.aws_ecr.Repository.fromRepositoryName(this, 'demo-aws-server-repo', 'demo-aws-server');
    const dockerImageFunction = new cdk.aws_lambda.DockerImageFunction(this, 'ProxyFunction', {
      environment: envMap.parsed,
      code: cdk.aws_lambda.DockerImageCode.fromEcr(repo, {
        tag: '1.0.0'
      }),
      timeout: Duration.seconds(30),
      functionName: 'ProxyFunction',
    });

    if(dockerImageFunction.role) {
      dockerImageFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['arn:aws:secretsmanager:ap-southeast-2:100150877581:secret:dev/perfect-stack-demo-KwkvSN'],
        actions: ['secretsmanager:GetSecretValue'],
      }));

      dockerImageFunction.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          'arn:aws:s3:::perfect-stack-demo-meta-s3',
          'arn:aws:s3:::perfect-stack-demo-meta-s3/*'
        ],
        actions: [
          's3:DeleteObject',
          's3:PutObject',
          's3:ListBucket',
          's3:GetObject',
        ]
      }));
    }

    // defines an API Gateway REST API resource backed by our "hello" function.
    new cdk.aws_apigateway.LambdaRestApi(this, 'Endpoint', {
      handler: dockerImageFunction
    });
  }
}
