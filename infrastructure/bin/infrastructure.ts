#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StackSetTestStack } from '../lib/stackset-test-stack';

const app = new cdk.App();

new StackSetTestStack(app, 'StackTestStack', {
    env: {
        account: '600627358911',
        region: 'us-east-2'
    },
});