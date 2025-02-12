const {
	OrganizationsClient,
	CreatePolicyCommand,
	DeletePolicyCommand,
	paginateListPolicies,
	ListRootsCommand,
	DescribeOrganizationCommand, DescribePolicyCommand
} = require("@aws-sdk/client-organizations")
const {togglePolicy} = require("./scp_rcp_api");


/**
 * Gets the organization ID.
 *
 * @param {OrganizationsClient} client - The initialized Organizations client.
 * @returns {Promise<string>} The organization ID.
 * @throws {Error} If there is an error fetching the organization.
 */
async function getOrganizationId(client) {
	try {
		const command = new DescribeOrganizationCommand({});
		const response = await client.send(command);
		return response.Organization.Id;
	} catch (error) {
		console.error("Error describing organization:", error);
		throw error;  // Re-throw the error for handling higher up
	}
}

/**
 * Gets the root ID of the organization.
 *
 * @param {OrganizationsClient} client - The initialized Organizations client.
 * @returns {Promise<string>} The root ID.
 * @throws {Error} If there is an error listing roots.
 */
async function getRootId(client) {
	try {
		const command = new ListRootsCommand({});
		const response = await client.send(command);
		// Assuming there's only one root.  Organizations currently only support one.
		return response.Roots[0].Id;
	} catch (error) {
		console.error("Error listing roots:", error);
		throw error; // Re-throw for handling
	}
}

/**
 * Gets the management account's path in the AWS Organizations hierarchy.
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @returns {Promise<string>} The management account path.
 */
async function getManagementAccountPath(accessKeyId, secretAccessKey, sessionToken) {
	const region = 'us-east-2'

	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)

		// Get organization and root id
		const organizationId = await getOrganizationId(client)
		const rootId = await getRootId(client)

		// make full path
		return `${organizationId}/${rootId}/*`
	} catch (error) {
		console.error("Error getting management account path:", error)
		throw error
	}
}


/**
 * Creates an AWS Organizations client.
 *
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} sessionToken
 * @param {string} region
 * @returns {OrganizationsClient}
 */
function createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region) {
	const credentials = {accessKeyId, secretAccessKey, sessionToken}
	return new OrganizationsClient({credentials, region})
}

//Helper function to handle pagination.
async function getAllPaginatedResults(client, paginatorFunction, params) {
	const results = []
	for await (const page of paginatorFunction({client}, params)) {
		const itemsKey = Object.keys(page).find(key => Array.isArray(page[key]))
		if (itemsKey) {
			results.push(...page[itemsKey])
		}
	}
	return results
}

/**
 * Returns the ID of the policy name specified
 *
 * @param policyName
 * @param policyList
 * @returns {*}
 */
function findPolicy(policyName, policyList) {
	return policyList.find(policy => policy.Name === policyName)
}

/**
 * This lists all the policies of the specific type
 *
 * @param client
 * @param filter - The type of policy. SERVICE_CONTROL_POLICY or RESOURCE_CONTROL_POLICY
 * @returns {Promise<*>}
 */
async function listAllPolicies(client, filter) {
	try {
		console.log('...getting a list of all policies...')
		return await getAllPaginatedResults(client, paginateListPolicies, {Filter: filter})
	} catch (error) {
		console.error("Error listing all policies:")
		throw error
	}
}

/**
 * Gets the Policy ID from the policy name
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @returns {Promise<string|undefined>}
 */
async function getPolicyIdFromName(accessKeyId, secretAccessKey, sessionToken, policyName) {
	const region = 'us-east-2'
	const policyType = 'SERVICE_CONTROL_POLICY' // Assuming that we are deleting Service Control Policies.

	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const policies = await listAllPolicies(client, policyType)
		const targetPolicy = findPolicy(policyName, policies)

		if (!targetPolicy) {
			console.log(`Policy named ${policyName} not found.`)
			return undefined
		}

		return targetPolicy.Id

	} catch (e) {
		console.log("Error in getting policy id from name")
		throw e
	}
}

/**
 * Creates an SCP
 *
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} sessionToken
 * @param {string} policyName
 * @param {string} policyContent - JSON string of the policy content.
 * @param {string} description
 * @param policyType
 * @returns {Promise<boolean>} - True if successful.
 */
async function createSCP(accessKeyId, secretAccessKey, sessionToken, policyName, policyContent, description, policyType) {
	const region = 'us-east-2'

	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const params = {
			Content: policyContent,
			Description: description,
			Name: policyName,
			Type: policyType
		}

		const command = new CreatePolicyCommand(params)
		const response = await client.send(command)
		console.log("...Successfully created policy:", policyName)
		return true
	} catch (error) {
		console.error("Error creating SCP:", error)
		console.log('The policy content: ', policyContent)
		return false
	}
}


/**
 * Creates network perimeter 1
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @param effect
 * @param action
 * @param resources
 * @param sourceIps
 * @param sourceVpcs
 * @returns {Promise<boolean>}
 */
async function createNetworkPerimeterSCP(accessKeyId, secretAccessKey, sessionToken, policyName, effect, action, resources, sourceIps, sourceVpcs) {

	const policyContent = JSON.stringify({
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "NetworkPerimeterOnIdentities",
				"Effect": effect,
				"Action": action,
				"Resource": resources,
				"Condition": {
					"NotIpAddressIfExists": {
						"aws:SourceIp": sourceIps
					},
					"StringNotEqualsIfExists": {
						"aws:SourceVpc": sourceVpcs
					}
				}
			}
		]
	})

	// Maybe make this user defined in the future?
	const description = "Network Perimeter SCP"
	const policyType = 'SERVICE_CONTROL_POLICY'

	return createSCP(accessKeyId, secretAccessKey, sessionToken, policyName, policyContent, description, policyType)
}


/**
 * Deletes an SCP
 *
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} sessionToken
 * @param {string} policyName
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise.
 */
async function deleteSCP(accessKeyId, secretAccessKey, sessionToken, policyName) {
	const region = 'us-east-2'

	try {
		// Needs to be detached before deletion
		const turnOffRes = await togglePolicy(
			accessKeyId, secretAccessKey, sessionToken,
			policyName, 'SERVICE_CONTROL_POLICY', false)

		const policyId = await getPolicyIdFromName(accessKeyId, secretAccessKey, sessionToken, policyName)

		if (!policyId) {
			console.log('...could not find policy id, so can not delete...')
			return false
		}

		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const params = {
			PolicyId: policyId,
		}
		const command = new DeletePolicyCommand(params)
		await client.send(command)
		console.log(`...Successfully deleted policy: ${policyName}`)
		return true
	} catch (error) {
		console.error("Error deleting SCP:", error)
		return false
	}
}

/**
 * Gets the details of a specific policy.
 *
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} sessionToken
 * @param {string} policyId
 * @returns {Promise<object>} The policy details.
 */
async function getPolicyDetails(accessKeyId, secretAccessKey, sessionToken, policyId) {
	const region = 'us-east-2'

	try {
		console.log(`...Getting policy ${policyId} details...`)
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const params = {
			PolicyId: policyId
		}
		const command = new DescribePolicyCommand(params)
		const response = await client.send(command)
		console.log('...successfully got policy details')
		return response.Policy
	} catch (error) {
		console.error("Error describing policy:", error)
		throw error
	}
}

/**
 * Gets network perimeter info, including Source VPCs.
 *
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} sessionToken
 * @param {string} policyName
 * @returns {Promise<object>} The extracted policy information.
 */
async function getNetworkPerimeter1Info(accessKeyId, secretAccessKey, sessionToken, policyName) {
	const region = 'us-east-2'

	try {
		console.log(`...getting ${policyName} details...`)
		const policyId = await getPolicyIdFromName(accessKeyId, secretAccessKey, sessionToken, policyName)
		const policyDetails = await getPolicyDetails(accessKeyId, secretAccessKey, sessionToken, policyId)
		const policyContent = JSON.parse(policyDetails.Content) //Corrected Line
		const statement = policyContent.Statement[0]

		const effect = statement.Effect
		const sid = statement.Sid
		const action = Array.isArray(statement.Action) ? statement.Action : [statement.Action]
		const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource]
		const sourceIps = statement.Condition && statement.Condition.NotIpAddressIfExists ? statement.Condition.NotIpAddressIfExists["aws:SourceIp"] : []
		const sourceVpcs = statement.Condition && statement.Condition.StringNotEqualsIfExists ? statement.Condition.StringNotEqualsIfExists["aws:SourceVpc"] : [] // Get Source VPCs

		console.log(`...successfully got ${policyName} details`)
		return {
			policyName: policyName,
			sid,
			effect,
			action,
			resources,
			sourceIps,
			sourceVpcs
		}

	} catch (error) {
		console.error("Error extracting network perimeter info:", error)
		throw error
	}
}

async function main() {

	// Please dont lock us out. make sure the IP list is right.

	const accessKeyId = "ASIAYXWBOFS7TXC5RT3N"
	const secretAccessKey = "+rggxoOHmM2vZBz0xZuCTAz9y9DSusdIn4Eu4ePY"
	const sessionToken = "IQoJb3JpZ2luX2VjEMj//////////wEaCXVzLWVhc3QtMiJGMEQCID+uH+NhSTY/D0SVGEMTOhClwxVuQV2NPagqXJnxgCS7AiBSTL+/V/2k/wEmHChpZqhT79dnZX/u2y3o8+rV5QcXASrNBAjh//////////8BEAAaDDYwMDYyNzM1ODkxMSIMHOLnG2k93/lZcAfGKqEE/+dMzzy0jknK/w5rYVIiX/SWHv8KVZwZxezMetSwHw2/+MbnkowQ+UbsBUbv9Gb+aprqsc3LzuHW+1DVbIiHjpZa/OpxgWLyETrFhP3CEbypAv238bt0lc8Fb8ymHJ5ns/socaJNhi/73pDNx9njZfoZvG+lcAIACHFzfoQU9PygJSvtGO7GLgDh7eGedA4wEHQ+Gq6su2XQnNdLTVTXwa6jAMs74Lu5VjywuHjHoMQ5IXJfL8D6apzQjdpAzXLBMB6foWuhcA9yh4aBVsGj5VB4ywggMWDWgvHZXdpvqxEs9VM4MoLF1Wz2ZnSchbeOMaVYvEFIvGPnHJCRx12Gy5SZ/4uisWqF6+AMd5orPSc8cb3RLt4CEC9VUdBvCcMHigIdIJxLo9eKg23HNgjduXcEo9xI1uAQT2ccovFqEFwJ7C2pUmr27v9VXJBV1tkUPQWVnQYEWqJs3WbvHJ5i1VSi2SlbXzfL5Os1itMtqKoGMjSp+/qg7S2jb0YRs0/YkgkxeitwUWoa9phm40p0kzQeJ3oX8M+O9QxZz2bmu8onVP20XhajZ6zzRvco7HaEI0ZaToxCjqvmke9mqIdIvwlUEBgEuxpfvuzw0DsLIAGeLJ/b5ybVbAcyEcAL3nGnAtMztujIj/PBrfcYlytCWQP5etCPBnNcwMU1TV8isxayYy7AUF4CqfgOSdQOBATSBgCPtEMp7jim0ElKpGGeRegw8cCvvQY6hgIUmk1NfFi3GePH1Liy3ekaPN66njLSP/osQ12uG39wUt0+Csg3W7mC/W0jvT+E5ex53Od/W2Bq1J6VhBN5fdbbPGcnAJOZOxif1bSctoq+B1oHJOSZDosplnyXlzOdvEYdblqoZQ9q7tL5Rwze5AlCet5tgTLU0tK8QB9rjk6vuLRufnUxmbMm6nnb+yaZzClMjxHSqLxE/w50ZK8wHirfiSs2lMJ3TVIUACg6G+w58TJ7F9ooXjkwXei5dCaM5t348YlfpgoGvXkiCEUy6+5h3WQH+Jbe8cd5v10Wq1WceqDJUKBrQ5dhkbk85APGHr/kGT4lA+lExgcliNmwta0aLlw7HwkK"

	const policyName = "Network_Perimeter_1"
	const effect = "Deny"
	const action = ["*"]
	const resources = ["*"]
	const sourceIps = [
		"192.112.253.15",
		"76.34.219.165",
		"174.100.1.243",
		"75.102.78.202",
		"192.112.253.16"
	]
	const sourceVpcs = ["vpc-0abb2ff774c6768a9"]

	//Get info
	const info = await getNetworkPerimeter1Info(accessKeyId, secretAccessKey, sessionToken, policyName)

	// Delete
	await deleteSCP(accessKeyId, secretAccessKey, sessionToken, policyName)

	// Create
	await createNetworkPerimeterSCP(
		accessKeyId, secretAccessKey, sessionToken, policyName,
		info.effect, info.action, info.resources, info.sourceIps, info.sourceVpcs
	)

}


if (require.main === module) {
	main()
}

module.exports = {createNetworkPerimeterSCP, deleteSCP, getNetworkPerimeter1Info}