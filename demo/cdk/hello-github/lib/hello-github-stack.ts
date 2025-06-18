import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class HelloGithubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloBucket = new cdk.aws_s3.Bucket(this, 'HelloBucket', {
      bucketName: "rjp-hello-bucket",
    });

    const currentDateTime = new Date().toISOString();
    const helloBucketDeployment = new cdk.aws_s3_deployment.BucketDeployment(this, 'HelloBucketDeployment', {
      sources: [
        cdk.aws_s3_deployment.Source.jsonData('hello.json', {
          hello: 'world',
          date: currentDateTime,
        }),
      ],
      destinationBucket: helloBucket,
      retainOnDelete: false,
    });
  }
}
