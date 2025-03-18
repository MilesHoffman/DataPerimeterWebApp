import * as cdk from 'aws-cdk-lib';
import * as cloudformation from 'aws-cdk-lib/aws-cloudformation';
import * as cxapi from 'aws-cdk-lib/cx-api'; // Import the Cloud Assembly API
import { Construct } from 'constructs';
import { StackSetTestStack } from './stackset-test-stack';

export class StackSetManagementStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. Create the nested stack (the one that defines your resources).
        const stackSetTestStack = new StackSetTestStack(this, 'EmbeddedStackSetTestStack');

        // 2. Synthesize the ENTIRE app (including this management stack).
        const app = this.node.root as cdk.App; // Get the App instance
        const assembly = app.synth(); // Synthesize the app

        // 3. Get the CloudFormation template from the synthesized assembly.
        const stackArtifact = assembly.getStackArtifact(stackSetTestStack.artifactId);
        const template = stackArtifact.template; // This is the correct way to get the template.
        const stackSetTemplateBody = JSON.stringify(template);


        // 4. Define the CfnStackSet resource.
        new cloudformation.CfnStackSet(this, 'MyOrganizationStackSet', {
            stackSetName: 'my-organization-test-stackset',
            templateBody: stackSetTemplateBody, // Use the correctly obtained template body
            permissionModel: 'SERVICE_MANAGED',
            autoDeployment: {
                enabled: true,
                retainStacksOnAccountRemoval: false,
            },
            stackInstancesGroup: [{
                deploymentTargets: {
                    organizationalUnitIds: [
                        this.node.tryGetContext('rootOuId') || 'r-YOUR_ROOT_OU_ID', // Replace
                    ],
                },
                regions: [this.region],
            }],
            capabilities: ['CAPABILITY_NAMED_IAM'],
        });
    }
}