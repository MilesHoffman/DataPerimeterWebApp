// lib/vpc-endpoint-stack.js
const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');

class VpcEndpointStack extends cdk.Stack {
	/**
	 * @param {cdk.App} scope
	 * @param {string} id
	 * @param {cdk.StackProps=} props
	 */
	constructor(scope, id, props) {
		super(scope, id, props);

		// Create a new VPC for the endpoint
		// In a real-world scenario, you might look up an existing VPC
		// const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', { vpcId: 'vpc-xxxxxxxxxxxxxxxxx' });
		const vpc = new ec2.Vpc(this, 'MyVpc', {
			maxAzs: 2, // Configure Availability Zones as needed
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: 'PrivateSubnet',
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Subnets for the endpoint interfaces
				},
				{
					cidrMask: 24,
					name: 'PublicSubnet',
					subnetType: ec2.SubnetType.PUBLIC, // Needed for NAT Gateway if PRIVATE_WITH_EGRESS
				}
			]
		});

		// Define the security group for the VPC Endpoint
		const endpointSecurityGroup = new ec2.SecurityGroup(this, 'EndpointSg', {
			vpc: vpc,
			allowAllOutbound: true, // Adjust outbound rules as per your security policy
			description: 'Security group for the S3 Global Access Point VPC endpoint'
		});

		// Allow traffic from resources within the VPC (e.g., EC2 instances)
		// to the endpoint on HTTPS (port 443)
		endpointSecurityGroup.addIngressRule(
			ec2.Peer.ipv4(vpc.vpcCidrBlock), // Or more specific peers like other security groups
			ec2.Port.tcp(443),
			'Allow HTTPS traffic from within the VPC'
		);

		// Create the Interface VPC Endpoint for S3 Global Access Point
		const s3GlobalEndpoint = new ec2.InterfaceVpcEndpoint(this, 'S3GlobalAccessPointEndpoint', {
			vpc: vpc,
			service: new ec2.InterfaceVpcEndpointAwsService('s3-global.accesspoint'),
			// Select subnets where endpoint network interfaces will be created
			// Often placed in private subnets
			subnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
			securityGroups: [endpointSecurityGroup],
			privateDnsEnabled: true // Allows using the standard AWS DNS name for the service

		});

		s3GlobalEndpoint.addToPolicy()

		// Output the DNS names of the endpoint for reference
		new cdk.CfnOutput(this, 'EndpointDnsEntries', {
			value: cdk.Fn.join(', ', s3GlobalEndpoint.vpcEndpointDnsEntries),
			description: 'DNS entries for the S3 Global Access Point VPC Endpoint'
		});

		new cdk.CfnOutput(this, 'EndpointIdOutput', {
			value: s3GlobalEndpoint.vpcEndpointId,
			description: 'ID of the S3 Global Access Point VPC Endpoint'
		});
	}
}

module.exports = { VpcEndpointStack }