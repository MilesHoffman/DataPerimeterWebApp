const {Stack} = require('aws-cdk-lib')
const organizations = require('aws-cdk-lib/aws-organizations')


/**
 * Stack that defines both resource perimeter 1 and 2.
 * Important: Make sure the organization root ID is correct.
 *
 * @author Miles Hoffman
 */
class ResourcePerimeterStack extends Stack {
	constructor(scope, id, props) {
		super(scope, id, props)
		const orgRootId = 'r-tnzp'
		const resourcePerimeter1 = 'Resource_Perimeter_1'


		// Define construct for creating Resource Perimeter 1 (SCP)
		// SCP denies S3 actions for untrusted resources
		const NetworkPerimeter1 = new organizations.CfnPolicy(this, resourcePerimeter1, {
			content: {
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "Statement1",
						"Effect": "Deny",
						"Action": [
							"s3:*"
						],
						"Resource": [
							"*"
						],
						"Condition": {
							"StringNotEqualsIfExists": {
								"aws:ResourceOrgID": "o-fppzquyt4f"
							}
						}
					}
				]
			},
			name: resourcePerimeter1,
			type: 'SERVICE_CONTROL_POLICY',
			targetIds: [], // No target
			description: 'Resource Perimeter 1 denies s3 actions for untrusted resources.'
		})

	}
}

module.exports = {ResourcePerimeterStack}