const {Stack} = require('aws-cdk-lib')
const organizations = require('aws-cdk-lib/aws-organizations')


/**
 * Stack that defines both network perimeter 1 and 2.
 * Important: Make sure the organization root ID is correct.
 *
 * @author Miles Hoffman
 */
class NetworkPerimeterStack extends Stack {
	constructor(scope, id, props) {
		super(scope, id, props)
		const orgRootId = 'r-tnzp'
		const networkPerimeter1 = 'Network_Perimeter_1'
		const networkPerimeter2 = 'Network_Perimeter_2'


		// Define construct for creating Network Perimeter 1 (SCP)
		// SCP denies S3 actions based on IP address and VPC id
		const NetworkPerimeter1 = new organizations.CfnPolicy(this, networkPerimeter1, {
			content: {
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "NetworkPerimeterOnIdentities",
						"Effect": "Deny",
						"Action": [
							"s3:*"
						],
						"Resource": [
							"*"
						],
						"Condition": {
							"NotIpAddressIfExists": { // White-listed IP addresses
								"aws:SourceIp": [
									"174.100.1.243", // Miles
								]
							},
							"StringNotEqualsIfExists": {
								"aws:SourceVpc": [
									"vpc-0548abfbee3584c42"
								]
							}
						}
					}
				]
			},
			name: networkPerimeter1,
			type: 'SERVICE_CONTROL_POLICY',
			targetIds: [], // no target
			description: 'Network Perimeter 1 denies s3 actions when on an untrusted VPC or IP.'
		})

		// Define construct for creating Network Perimeter 2 (RCP)
		// RCP denies S3 actions based on IP address and VPC id
		const NetworkPerimeter2 = new organizations.CfnPolicy(this, networkPerimeter2, {
			content: {
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "NetworkPerimeterOnIdentities",
						"Principal": "*",
						"Effect": "Deny",
						"Action": [
							"s3:*"
						],
						"Resource": [
							"*"
						],
						"Condition": {
							"NotIpAddressIfExists": { // White-listed IPs
								"aws:SourceIp": [
									"174.100.1.243" // Miles
								]
							},
							"StringNotEqualsIfExists": {
								"aws:SourceVpc": [
									"vpc-0548abfbee3584c42"
								]
							}
						}
					}
				]
			},
			name: networkPerimeter2,
			type: 'RESOURCE_CONTROL_POLICY',
			targetIds: [], // no target
			description: 'Network Perimeter 2 denies s3 actions when on an untrusted VPC or IP.'
		})
	}
}

module.exports = {NetworkPerimeterStack}