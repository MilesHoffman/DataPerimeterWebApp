import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StackSetTestStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new s3.Bucket(this, 'OrgTestBucket', {
            bucketName: cdk.Fn.join('-', [
                'org-test-bucket',
                cdk.Aws.ACCOUNT_ID,
                cdk.Aws.REGION,
                cdk.Fn.select(0, cdk.Fn.split('-', cdk.Aws.STACK_NAME)) //Make unique across stack instances.
            ]),
            removalPolicy: cdk.RemovalPolicy.DESTROY, // CAREFUL:  For testing only!
            autoDeleteObjects: true, // CAREFUL: For testing only!
        });
    }
}