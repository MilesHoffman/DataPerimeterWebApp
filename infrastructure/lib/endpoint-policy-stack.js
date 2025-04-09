const { Stack, RemovalPolicy, Fn } = require('aws-cdk-lib');
const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');

class EndpointPolicyStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const vpcName = 'MyVPC';

        // 1. Create the VPC
        const vpc = new ec2.Vpc(this, 'AppVPC', {
            vpcName: vpcName,
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });

        // 2. Create the Security Group for the Endpoint
        const endpointSecurityGroup = new ec2.SecurityGroup(this, 'EndpointSg', {
            vpc: vpc,
            allowAllOutbound: true, // Adjust as needed
            description: 'Security group for the S3 Global Access Point VPC endpoint'
        });

        // Allow HTTPS traffic only from within the VPC CIDR block.
        endpointSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(vpc.vpcCidrBlock),
            ec2.Port.tcp(443),
            'Allow HTTPS traffic from within the VPC'
        );

        // 3. Create the Interface VPC Endpoint
        const s3GlobalEndpoint = new ec2.InterfaceVpcEndpoint(this, 'S3GlobalAccessPointEndpoint', {
            vpc: vpc,
            service: new ec2.InterfaceVpcEndpointAwsService('s3-global.accesspoint'),
            subnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [endpointSecurityGroup],
            privateDnsEnabled: true

        });

        // 4. Define and Attach the Endpoint Policy Statements

        // Statement 1: Deny requests unless Principal and Resource are in the specified Org
        const denyOrgStatement = new iam.PolicyStatement({
            sid: "AllowRequestsByOrgsIdentitiesToOrgsResources",
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['*'],
            resources: ['*'],
            conditions: {
                "StringNotEquals": {
                    "aws:PrincipalOrgID": "o-fppzquyt4f",
                    "aws:ResourceOrgID": "o-fppzquyt4f"
                }
            }
        });


        const allowAllStatement = new iam.PolicyStatement({
            sid: "AllowRequests", // Add the Sid
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['*'],
            resources: ['*']

        });

        s3GlobalEndpoint.addToPolicy(denyOrgStatement);
        s3GlobalEndpoint.addToPolicy(allowAllStatement);


        // 5. Outputs
        new cdk.CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
            description: 'ID of the VPC'
        });

        new cdk.CfnOutput(this, 'EndpointIdOutput', {
            value: s3GlobalEndpoint.vpcEndpointId,
            description: 'ID of the S3 Global Access Point VPC Endpoint'
        });

        new cdk.CfnOutput(this, 'EndpointDnsEntries', {
            value: Fn.join(', ', s3GlobalEndpoint.vpcEndpointDnsEntries),
            description: 'DNS entries for the S3 Global Access Point VPC Endpoint'
        });
    }
}

module.exports = { EndpointPolicyStack };