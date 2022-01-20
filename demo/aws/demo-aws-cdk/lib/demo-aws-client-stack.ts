import * as cdk from 'aws-cdk-lib';
import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {MyStackProps} from '../bin/demo-aws-cdk';


export class DemoAwsClientStack extends Stack {
    constructor(scope: Construct, id: string, props?: MyStackProps) {
        super(scope, id, props);

        const releaseBucket = cdk.aws_s3.Bucket.fromBucketName(this, 'ReleaseBucket', 'demo-aws-client-release');

        new cdk.aws_cloudfront.Distribution(this, 'MyDist', {
            defaultBehavior: {
                origin: new cdk.aws_cloudfront_origins.S3Origin(releaseBucket, {originPath: '/0.0.0'}),
                allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            },
            errorResponses: [
                {httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html'},
                {httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html'}
            ]
        });
    }
}
