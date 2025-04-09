const cdk = require('aws-cdk-lib');
const { NetworkPerimeterStack } = require('../lib/network-perimeter-stack');
const { ResourcePerimeterStack } = require('../lib/resource-perimeter-stack');
const { IdentityPerimeterStack } = require('../lib/identity-perimeter-stack');
const { EndpointPolicyStack } = require('../lib/endpoint-policy-stack');

// Deployment of the app will utilize the AWS CLI default profile credentials.
// (Or use "<cdk command> --profile <NAME>" for a specific profile).
const app = new cdk.App();

// Deploys the Network Perimeter Stack on the specified account and region
new NetworkPerimeterStack(app, 'NetworkPerimeterStack', {
	env: { account: '600627358911', region: 'us-east-2' },
});

// Deploys the Resource Perimeter Stack
new ResourcePerimeterStack(app, 'ResourcePerimeterStack', {
	env: { account: '600627358911', region: 'us-east-2' },
});

// Deploys the Identity Perimeter Stack
new IdentityPerimeterStack(app, 'IdentityPerimeterStack', {
	env: { account: '600627358911', region: 'us-east-2' },
});
// Deploys the endpoint policies
new EndpointPolicyStack(app, 'EndpointPolicyStack', {
	env: { account: '600627358911', region: 'us-east-2' },
})