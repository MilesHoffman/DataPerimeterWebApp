#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StackSetManagementStack } from '../lib/stackset-management-stack'; // Import the new stack

const app = new cdk.App();

new StackSetManagementStack(app, 'StackSetManagementStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT, // Your MANAGEMENT account
        region: process.env.CDK_DEFAULT_REGION,    // Your management account's region
    },
});