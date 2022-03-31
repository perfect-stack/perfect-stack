import * as cdk from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {MyStackProps} from '../bin/demo-aws-cdk';


export class DemoAwsClientStack extends Stack {
    constructor(scope: Construct, id: string, props?: MyStackProps) {
        super(scope, id, props);

        const releaseBucket = cdk.aws_s3.Bucket.fromBucketName(this, 'ReleaseBucket', 'demo-aws-client-release');
        const origin = new cdk.aws_cloudfront_origins.S3Origin(releaseBucket, {originPath: '/1.0.5'});
        const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'Certificate', 'arn:aws:acm:us-east-1:100150877581:certificate/813ee628-7e7a-4838-8eb8-7cbc2daa53c0');

        const distribution = new cdk.aws_cloudfront.Distribution(this, 'MyCloudFrontDist', {
            defaultBehavior: {
                origin: origin,
                allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            errorResponses: [
                {httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html'},
                {httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html'}
            ],
            domainNames: ['demo2.base-stack.net'],
            certificate: certificate,
        });

        distribution.addBehavior('index.html', origin, {
            cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED
        });

        const hostedZone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId: 'ZW901XGFTH3BW',
            zoneName: 'base-stack.net'
        });

        const cname = new cdk.aws_route53.CnameRecord(this, 'Cname', {
            recordName: 'demo2',
            domainName: distribution.domainName,
            zone: hostedZone,
        });
    }
}
