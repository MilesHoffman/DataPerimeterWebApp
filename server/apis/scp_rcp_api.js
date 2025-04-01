const {
	OrganizationsClient,
	CreatePolicyCommand,
	DeletePolicyCommand,
	paginateListPolicies,
	ListRootsCommand,
	DescribeOrganizationCommand,
	DescribePolicyCommand,
	UpdatePolicyCommand,
	AttachPolicyCommand,
	DetachPolicyCommand,
	paginateListRoots,
	paginateListPoliciesForTarget
} = require("@aws-sdk/client-organizations")

// --- AWS Organization Info Utilities ---

// Gets the AWS Organization ID.
async function getOrganizationId(client) {
	try {
		const command = new DescribeOrganizationCommand({});
		const response = await client.send(command);
		return response.Organization.Id;
	} catch (error) {
		console.error("Error describing organization:", error);
		throw error;
	}
}

// Gets the Organization's Root ID.
async function getRootId(client) {
	try {
		const command = new ListRootsCommand({});
		const response = await client.send(command);
		return response.Roots[0].Id;
	} catch (error) {
		console.error("Error listing roots:", error);
		throw error;
	}
}

// Constructs the management account path string (used mainly for resource paths).
async function getManagementAccountPath(accessKeyId, secretAccessKey, sessionToken) {
	const region = 'us-east-2'
	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const organizationId = await getOrganizationId(client)
		const rootId = await getRootId(client)
		return `${organizationId}/${rootId}/*`
	} catch (error) {
		console.error("Error getting management account path:", error)
		throw error
	}
}

// Creates an AWS Organizations API client instance.
function createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region) {
	const credentials = {accessKeyId, secretAccessKey, sessionToken}
	return new OrganizationsClient({credentials, region})
}

// --- AWS SDK Helper Utilities ---

// Handles AWS SDK pagination to retrieve all results from list operations.
async function getAllPaginatedResults(client, paginatorFunction, params) {
	const results = []
	for await (const page of paginatorFunction({client}, params)) {
		const itemsKey = Object.keys(page).find(key => Array.isArray(page[key]))
		if (itemsKey) {
			results.push(...page[itemsKey])
		}
	}
	return results;
}

// Finds a policy object by name within a list of policies.
function findPolicy(policyName, policyList) {
	return policyList.find(policy => policy.Name === policyName)
}

// --- AWS Organization Policy Listing Functions ---

// Lists all policies of a specific type (SERVICE_CONTROL_POLICY or RESOURCE_CONTROL_POLICY).
async function listAllPolicies(client, filter) {
	try {
		console.log(`...getting a list of all ${filter} policies...`)
		return await getAllPaginatedResults(client, paginateListPolicies, {Filter: filter})
	} catch (error) {
		console.error(`Error listing ${filter} policies:`, error)
		throw error
	}
}

// Lists organization root(s).
async function listRoots(client) {
	try {
		console.log("...Calling paginateListRoots...");
		const result = await getAllPaginatedResults(client, paginateListRoots, {})
		return result
	} catch (error) {
		console.error("Error listing roots:")
		throw error
	}
}

// Lists policies attached to a specific target (e.g., Root or OU).
async function listPoliciesForTarget(targetId, client, filter) {
	try {
		return await getAllPaginatedResults(client, paginateListPoliciesForTarget, { TargetId: targetId, Filter: filter })
	} catch (error) {
		console.error(`Error listing policies for target ${targetId}`)
		throw error
	}
}

// --- Core Policy CRUD and Info Functions ---

// Fetches details (including content) for a specific policy ID.
async function getPolicyDetails(accessKeyId, secretAccessKey, sessionToken, policyId) {
	const region = 'us-east-2'
	try {
		console.log(`...Getting policy ${policyId} details...`)
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const params = { PolicyId: policyId }
		const command = new DescribePolicyCommand(params)
		const response = await client.send(command)
		console.log('...successfully got policy details')
		return response.Policy
	} catch (error) {
		console.error("Error describing policy:", error)
		throw error
	}
}

// Retrieves a policy's ID based on its name and type (defaults to SCP).
async function getPolicyIdFromName(accessKeyId, secretAccessKey, sessionToken, policyName, policyType = 'SERVICE_CONTROL_POLICY') {
	const region = 'us-east-2'
	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const policies = await listAllPolicies(client, policyType)
		const targetPolicy = findPolicy(policyName, policies)

		if (!targetPolicy) {
			console.log(`${policyType} policy named ${policyName} not found.`)
			return undefined
		}
		return targetPolicy.Id
	} catch (e) {
		console.error(`Error getting policy ID for ${policyName} (${policyType}):`, e)
		throw e
	}
}

// Updates a policy's content, name, or description.
async function updatePolicyContent(accessKeyId, secretAccessKey, sessionToken, policyId, policyContent, policyName, description) {
	const region = 'us-east-2'
	if (!policyContent && !policyName && !description) {
		console.warn("Update policy called without providing Content, Name, or Description.");
		return false;
	}
	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)
		const params = {
			PolicyId: policyId,
			...(policyContent && { Content: policyContent }),
			...(policyName && { Name: policyName }),
			...(description && { Description: description })
		}
		const command = new UpdatePolicyCommand(params)
		await client.send(command)
		console.log(`...Successfully updated policy content for ID: ${policyId}`)
		return true
	} catch (error) {
		console.error("Error updating policy content:", error)
		console.log('Policy ID attempted:', policyId)
		if (policyContent) console.log('The new policy content:', policyContent)
		return false
	}
}

// --- Policy Attachment Functions ---

// Attaches a policy to a target (e.g., Root).
async function attachPolicy(policyId, targetId, client) {
	const params = { PolicyId: policyId, TargetId: targetId }
	try {
		console.log('...attempting to attach policy...')
		const command = new AttachPolicyCommand(params)
		await client.send(command);
		console.log(`...Successfully attached policy ${policyId} to target ${targetId}`)
	} catch (error) {
		// Handles if policy is already attached
		if( error.__type === 'DuplicatePolicyAttachmentException'){
			console.log('...policy is already attached...')
		}
		else{
			console.error(`Error attaching policy ${policyId} to target ${targetId}`)
			throw error
		}
	}
}

// Detaches a policy from a target (e.g., Root).
async function detachPolicy(policyId, targetId, client) {
	const params = { PolicyId: policyId, TargetId: targetId }
	try {
		console.log(`...attempting to detach ${policyId}...`)
		const command = new DetachPolicyCommand(params)
		await client.send(command);
		console.log(`...Successfully detached policy ${policyId} from target ${targetId}`)
	} catch (error) {
		// Handles if policy is already detached
		if( error.__type === 'PolicyNotAttachedException'){
			console.log('...policy is already detached...')
		}
		else{
			console.error(`Error detaching policy ${policyId} to target ${targetId}`)
			throw error
		}
	}
}

// Attaches or detaches a policy from the organization root based on the 'attached' flag.
async function togglePolicy(
	accessKeyId,
	secretAccessKey,
	sessionToken, policyName,
	policyType = 'RESOURCE_CONTROL_POLICY' || 'SERVICE_CONTROL_POLICY',
	attached) {

	const region = 'us-east-2'
	// Ensure valid policy type, default to SCP otherwise
	const effectivePolicyType = (policyType === 'SERVICE_CONTROL_POLICY' || policyType === 'RESOURCE_CONTROL_POLICY') ? policyType : 'SERVICE_CONTROL_POLICY';

	console.log(`...attempting process to turn ${policyName} (${effectivePolicyType}) to attached=${attached}...`)

	try{
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)

		const allPolices = await listAllPolicies(client, effectivePolicyType)
		const targetPolicy = findPolicy(policyName, allPolices)
		if (!targetPolicy) {
			console.error(`Policy named ${policyName} of type ${effectivePolicyType} not found during toggle.`);
			return false;
		}
		const targetPolicyId = targetPolicy.Id

		const roots = await listRoots(client)
		if (!roots || roots.length === 0) {
			console.error("Could not find organization root.");
			return false;
		}
		const rootId = roots[0].Id

		if (attached) {
			await attachPolicy(targetPolicyId, rootId, client)
		} else {
			await detachPolicy(targetPolicyId, rootId, client)
		}

		return true
	}catch (e){
		console.log(`Error in togglePolicy function:\n ${e}\n`)
		return false
	}
}

// Checks if a named policy is attached to the organization root.
async function isPolicyAttached(accessKeyId, secretAccessKey, sessionToken, policyName, policyType) {
	const region = 'us-east-2';

	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region);

		const allPolicies = await listAllPolicies(client, policyType);
		const targetPolicy = findPolicy(policyName, allPolicies);
		if (!targetPolicy) {
			console.log(`Policy named ${policyName} not found.`);
			// Policy not existing is not an error in checking status
			return { attached: false, error: false };
		}
		const targetPolicyId = targetPolicy.Id

		const roots = await listRoots(client);
		if (!roots || roots.length === 0) {
			console.error("Could not find organization root.");
			return { attached: false, error: true }; // Indicate error finding root
		}
		const rootId = roots[0].Id;

		const attachedPolicies = await listPoliciesForTarget(rootId, client, policyType);

		// Check if target policy ID exists in the list of attached policies
		return {
			attached: attachedPolicies.some(policy => policy.Id === targetPolicyId),
			error: false
		}
	} catch (error) {
		console.error("Error checking if policy is attached:", error);
		return { attached: false, error: true } // Indicate general error
	}
}

// --- Specific Network Perimeter Policy Functions ---

// Parses policy content assuming the structure of Network Perimeter 1 (SCP).
async function getNetworkPerimeter1Info(accessKeyId, secretAccessKey, sessionToken, policyName, policyType = 'SERVICE_CONTROL_POLICY') {
	const region = 'us-east-2'
	try {
		console.log(`...getting ${policyName} (${policyType}) details...`)
		const policyId = await getPolicyIdFromName(accessKeyId, secretAccessKey, sessionToken, policyName, policyType)

		if (!policyId) {
			console.log(`Policy ${policyName} (${policyType}) not found.`);
			return null;
		}

		const policyDetails = await getPolicyDetails(accessKeyId, secretAccessKey, sessionToken, policyId)

		if (!policyDetails || !policyDetails.Content) {
			console.error(`Failed to get content for policy ID ${policyId}.`);
			return null;
		}

		const policyContent = JSON.parse(policyDetails.Content)

		// Validate expected structure
		if (!policyContent.Statement || !Array.isArray(policyContent.Statement) || policyContent.Statement.length === 0) {
			console.error(`Policy ${policyName} (ID: ${policyId}) content has unexpected structure (missing or empty Statement array).`);
			return null;
		}
		const statement = policyContent.Statement[0] // Assumes first statement is relevant

		if (!statement || !statement.Effect || !statement.Action || !statement.Resource) {
			console.error(`Policy ${policyName} (ID: ${policyId}) statement[0] is missing required fields (Effect, Action, Resource).`);
			return null;
		}

		// Extract data, ensuring arrays for multi-value fields
		const effect = statement.Effect
		const sid = statement.Sid || 'N/A'
		const action = Array.isArray(statement.Action) ? statement.Action : [statement.Action]
		const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource]

		const condition = statement.Condition || {};
		const notIpAddressIfExists = condition.NotIpAddressIfExists || {};
		const stringNotEqualsIfExists = condition.StringNotEqualsIfExists || {};

		const sourceIpsInput = notIpAddressIfExists["aws:SourceIp"]
		const sourceVpcsInput = stringNotEqualsIfExists["aws:SourceVpc"]

		const sourceIps = sourceIpsInput ? (Array.isArray(sourceIpsInput) ? sourceIpsInput : [sourceIpsInput]) : []
		const sourceVpcs = sourceVpcsInput ? (Array.isArray(sourceVpcsInput) ? sourceVpcsInput : [sourceVpcsInput]) : []

		console.log(`...successfully got ${policyName} details`)
		return {
			policyName: policyName,
			policyId: policyId,
			policyType: policyType,
			sid,
			effect,
			action,
			resources,
			sourceIps,
			sourceVpcs
		}
	} catch (error) {
		console.error(`Error extracting info for ${policyName} (${policyType}):`, error)
		return null // Return null on error
	}
}

// Parses policy content assuming the structure of Network Perimeter 2 (RCP).
async function getNetworkPerimeter2Info(accessKeyId, secretAccessKey, sessionToken, policyName, policyType = 'RESOURCE_CONTROL_POLICY') {
	const region = 'us-east-2'
	try {
		console.log(`...getting ${policyName} (${policyType}) details...`)

		const policyId = await getPolicyIdFromName(accessKeyId, secretAccessKey, sessionToken, policyName, policyType)

		if (!policyId) {
			console.log(`Policy ${policyName} (${policyType}) not found.`)
			return null;
		}

		const policyDetails = await getPolicyDetails(accessKeyId, secretAccessKey, sessionToken, policyId)

		if (!policyDetails || !policyDetails.Content) {
			console.error(`Failed to get content for policy ID ${policyId}.`)
			return null;
		}

		const policyContent = JSON.parse(policyDetails.Content)

		// Validate expected structure
		if (!policyContent.Statement || !Array.isArray(policyContent.Statement) || policyContent.Statement.length === 0) {
			console.error(`Policy ${policyName} (ID: ${policyId}) content has unexpected structure (missing or empty Statement array).`)
			return null;
		}
		const statement = policyContent.Statement[0] // Assumes first statement is relevant

		if (!statement || !statement.Effect || !statement.Action || !statement.Resource) {
			console.error(`Policy ${policyName} (ID: ${policyId}) statement[0] is missing required fields (Effect, Action, Resource).`)
			return null;
		}

		// Extract data, ensuring arrays
		const effect = statement.Effect
		const sid = statement.Sid || 'N/A'

		const action = Array.isArray(statement.Action) ? statement.Action : [statement.Action]
		const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource]

		const condition = statement.Condition || {};
		const notIpAddressIfExists = condition.NotIpAddressIfExists || {};
		const stringNotEqualsIfExists = condition.StringNotEqualsIfExists || {};

		const sourceIpsInput = notIpAddressIfExists["aws:SourceIp"]
		const sourceVpcsInput = stringNotEqualsIfExists["aws:SourceVpc"]
		const sourceIps = sourceIpsInput ? (Array.isArray(sourceIpsInput) ? sourceIpsInput : [sourceIpsInput]) : []
		const sourceVpcs = sourceVpcsInput ? (Array.isArray(sourceVpcsInput) ? sourceVpcsInput : [sourceVpcsInput]) : []

		console.log(`...successfully got ${policyName} (${policyType}) details`)

		return {
			policyName: policyName,
			policyId: policyId,
			policyType: policyType,
			sid,
			effect,
			action,
			resources,
			sourceIps,
			sourceVpcs
		}

	} catch (error) {
		console.error(`Error extracting info for ${policyName} (${policyType}):`, error)
		return null // Return null on error
	}
}

module.exports = {
	updatePolicyContent,
	getPolicyIdFromName,
	getPolicyDetails,
	togglePolicy,
	isPolicyAttached,
	getNetworkPerimeter1Info,
	getNetworkPerimeter2Info,
	createOrganizationsClient,
	getManagementAccountPath
}