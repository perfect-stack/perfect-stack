import * as cdk from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {MyStackProps} from '../bin/demo-aws-cdk';


export class DemoAwsClientStack extends Stack {
    constructor(scope: Construct, id: string, props?: MyStackProps) {
        super(scope, id, props);

        const releaseBucket = cdk.aws_s3.Bucket.fromBucketName(this, 'ReleaseBucket', 'demo-aws-client-release');

        const origin = new cdk.aws_cloudfront_origins.S3Origin(releaseBucket, {originPath: '/1.0.3'});
        const distribution = new cdk.aws_cloudfront.Distribution(this, 'MyCloudFrontDist', {
            defaultBehavior: {
                origin: origin,
                allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            errorResponses: [
                {httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html'},
                {httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html'}
            ]
        });

        distribution.addBehavior('index.html', origin, {
            cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED
        })
    }
}
