import * as cdk from 'aws-cdk-lib';
import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Effect} from 'aws-cdk-lib/aws-iam';
import {MyStackProps} from '../bin/demo-aws-cdk';


export class DemoAwsServerStack extends Stack {
  constructor(scope: Construct, id: string, props?: MyStackProps) {
    super(scope, id, props);

    const repo = cdk.aws_ecr.Repository.fromRepositoryName(this, 'demo-aws-server-repo', 'demo-aws-server');
    const dockerImageFunction = new cdk.aws_lambda.DockerImageFunction(this, 'ProxyFunction', {
      environment: props?.envMap.parsed,
      code: cdk.aws_lambda.DockerImageCode.fromEcr(repo, {
        tag: '1.0.2'
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
