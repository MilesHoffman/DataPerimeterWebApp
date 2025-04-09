const {Stack} = require('aws-cdk-lib')
const organizations = require('aws-cdk-lib/aws-organizations')


/**
 * Stack that defines both identity perimeter 1 and 2.
 * Important: Make sure the organization root ID is correct.
 *
 * @author Miles Hoffman
 */
class IdentityPerimeterStack extends Stack {
	constructor(scope, id, props) {
		super(scope, id, props)
		const orgRootId = 'r-tnzp'
		const identityPerimeter1 = 'Identity_Perimeter_1'


		// Define construct for creating Resource Perimeter 1 (SCP)
		// SCP denies S3 actions for untrusted resources
		const IdentityPerimeter1 = new organizations.CfnPolicy(this, identityPerimeter1, {
			content: {
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "Statement1",
						"Effect": "Deny",
						"Principal": "*",
						"Action": "s3:*",
						"Resource": "*",
						"Condition": {
							"StringNotEqualsIfExists": {
								"aws:PrincipalOrgID": "o-fppzquyt4f",
								"aws:SourceOrgID": "o-fppzquyt4f"
							}
						}
					}
				]
			},
			name: identityPerimeter1,
			type: 'RESOURCE_CONTROL_POLICY',
			targetIds: [], // No target
			description: 'Identity Perimeter 1 denies s3 actions for untrusted identities.'
		})

	}
}

module.exports = {IdentityPerimeterStack}