const {
	OrganizationsClient,
	AttachPolicyCommand,
	DetachPolicyCommand,
	paginateListRoots,
	paginateListPoliciesForTarget,
	paginateListPolicies,
} =  require("@aws-sdk/client-organizations")

//Helper function to handle pagination.
async function getAllPaginatedResults(client, paginatorFunction, params) {
	const results = []
	for await (const page of paginatorFunction({ client }, params)) {
		const itemsKey = Object.keys(page).find(key => Array.isArray(page[key]))
		if (itemsKey) {
			results.push(...page[itemsKey])
		}
	}
	return results;
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
 * Using credentials, a client organization is created. Gives the ability to interact with scp or rcp
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param region
 * @returns {OrganizationsClient}
 */
function createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region) {
	const credentials = { accessKeyId, secretAccessKey, sessionToken }
	return new OrganizationsClient({ credentials, region })
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
		return await getAllPaginatedResults(client, paginateListPolicies, { Filter: filter })
	} catch (error) {
		console.error("Error listing all policies:")
		throw error
	}
}

//This lists all the roots in the organization
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

/**
 * This list all the policies attached to a target
 * @param targetId
 * @param client
 * @param filter
 * @returns {Promise<*[]>}
 */
async function listPoliciesForTarget(targetId, client, filter) {
	try {
		return await getAllPaginatedResults(client, paginateListPoliciesForTarget, { TargetId: targetId, Filter: filter })
	} catch (error) {
		console.error(`Error listing policies for target ${targetId}`)
		throw error
	}
}

/**
 * Attaches policy to target
 * @param policyId
 * @param targetId
 * @param client
 * @returns {Promise<void>}
 */
async function attachPolicy(policyId, targetId, client) {
	const params = { PolicyId: policyId, TargetId: targetId }
	try {
		console.log('...attempting to attach policy...')
		const command = new AttachPolicyCommand(params)
		await client.send(command);
		console.log(`...Successfully attached policy ${policyId} to target ${targetId}`)
	} catch (error) {

		if( error.__type === 'DuplicatePolicyAttachmentException'){
			console.log('...policy is already attached...')
		}
		else{
			console.error(`Error attaching policy ${policyId} to target ${targetId}`)
			throw error
		}
	}
}

/**
 * Detaches policy
 * @param policyId
 * @param targetId
 * @param client
 * @returns {Promise<void>}
 */
async function detachPolicy(policyId, targetId, client) {
	const params = { PolicyId: policyId, TargetId: targetId }
	try {
		console.log(`...attempting to detach ${policyId}...`)
		const command = new DetachPolicyCommand(params)
		await client.send(command);
		console.log(`...Successfully detached policy ${policyId} from target ${targetId}`)
	} catch (error) {
		if( error.__type === 'PolicyNotAttachedException'){
			console.log('...policy is already detached...')
		}
		else{
			console.error(`Error detaching policy ${policyId} to target ${targetId}`)
			throw error
		}
	}
}


/**
 * Turns the specific scp or rcp on and off. Use the management account.
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @param policyType - Specifies the policy type (SERVICE_CONTROL_POLICY or RESOURCE_CONTROL_POLICY)
 * @param attached {boolean} - Policy will be toggled according to this
 * @returns {Promise<boolean>}
 */
async function togglePolicy(
		accessKeyId,
	    secretAccessKey,
	    sessionToken, policyName,
	    policyType = 'RESOURCE_CONTROL_POLICY' || 'SERVICE_CONTROL_POLICY',
	    attached) {

	const region = 'use-east-2'

	console.log(`...attempting process to turn ${policyName} to ${attached}...`)

	try{
		// Creating the client
		const client = await createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)

		// Getting list of policies
		const allPolices = await listAllPolicies(client, policyType)

		// Getting target policy ID
		const targetPolicyId = findPolicy(policyName, allPolices).Id

		// Getting the IDs of the org
		const roots = await listRoots(client)

		// Getting the root ID of the org
		const rootId = roots[0].Id // Essentially the root of the org

		// Attaching or detaching  the policy
		attached ?
			await attachPolicy(targetPolicyId, rootId, client) :
			await detachPolicy(targetPolicyId, rootId, client)

		return true
	}catch (e){
		console.log(`Error in togglePolicy function:\n ${e}\n`)
		return false
	}
}

/**
 * Checks if a policy is attached to the root target.
 *
 * @param {string} accessKeyId - AWS access key ID.
 * @param {string} secretAccessKey - AWS secret access key.
 * @param {string} sessionToken - AWS session token.
 * @param {string} policyName - The name of the policy.
 * @param {string} policyType - The type of the policy (e.g., 'SERVICE_CONTROL_POLICY').
 * @returns {Promise<boolean>} - An object indicating if the policy is attached.
 */
async function isPolicyAttached(accessKeyId, secretAccessKey, sessionToken, policyName, policyType) {
	const region = 'us-east-2';

	try {
		const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region);

		// Get list of all policies of the specified type
		const allPolicies = await listAllPolicies(client, policyType);

		// Find the target policy by name
		const targetPolicy = findPolicy(policyName, allPolicies);
		if (!targetPolicy) {
			console.log(`Policy named ${policyName} not found.`);
			return false; // Policy doesn't exist, so it's not attached
		}
		const targetPolicyId = targetPolicy.Id

		// Get the root ID
		const roots = await listRoots(client);
		const rootId = roots[0].Id;

		// List policies attached to the root
		const attachedPolicies = await listPoliciesForTarget(rootId, client, policyType);

		// Check if the target policy is in the list of attached policies
		return attachedPolicies.some(policy => policy.Id === targetPolicyId);
	} catch (error) {
		console.error("Error: In checking if policy is attached:", error);
		return false
	}
}


async function main() {

	const accessKeyId = "ASIAYXWBOFS7ZO65UFQ7";
	const secretAccessKey = "DiOAxYeXkmD79Zamij8z3nTNehzgtGIRlcWMiNIa"
	const sessionToken =  "IQoJb3JpZ2luX2VjEMX//////////wEaCXVzLWVhc3QtMiJHMEUCIQDSHmnos4zE7dCuDurg6NpRndeTfJD8D2wPX4jRhTMDxAIgWliApvsdixK80tdr+N+c4zZt9z1oULC265wXl+P7evgqzQQI3v//////////ARAAGgw2MDA2MjczNTg5MTEiDDPZwPAAhwpTwSpiBiqhBOUS1Y/u6S/WeWgsv2hSO+9StYwYo6710B/ZB9zRbkwy29ude/cJoWEO/kwnFdpA3JgdAMEv2PtT4X/NQEfZWkCtShynTNDH6FhXa+gnuEX96pgADAk2YYKEPNnmFUrmyrqKExdPUgH/5XYWfnlbr/dMJJUBamGfCoZ347VJmiFcPD06+cGnefAKwECQGE+FXa5SNVsdfJn5svWER81fb8jRm1h6kpGBj38credbm8tbu/c9tRnUPUkALqENzHY9bU/MGeL5H7RQzhitPkwtGTpEMe+LNSgxEOEIHvCWIZsPCDYrHAv+R51hZzCheyOdE8EaLbPExU7MD73l7A9mZbEzqu43x/G2dE1yIIdepLPQEKp9onyBjV+UU3zy0OPfcALshcss15mx499SLv3R+xaG5dbi4He4py7AkktGTJF2iJrf+GMzwRHLTYz2ObYYJMrA1MVMJRsm8VoQfwdqwhyU32UC/6eSD0AX0LELkgGAOMeTagkdfJ0fN9X1EYjSxJHJWcQU+2WpPggVgXp2s9pvpK1zVgQn3q97FFI5Rid3Qym8jC3nC+lNvwl4k1hSDCMn1z4BFPnY0x7xt2HTPJxdVDQxA+6wYFhAzeZ75MzGlO2vEyjBwE6bNL9F305KWP5jZhXWN+Bj6PyhJPuBqATt/fxP9eor6mNorknZ3GARxm1iRrb0NTnpzRs4nOdyhE5hX1nrJJ8wVkZT7CjtJVk2MJ7+rr0GOoUC2E4jeSCjdQBoEpqT7lg/lI1xoTEEs19GjT2jMJVADtqdLR4+L8lZXGv68UqC7TsJUtO/H/pZiHopXegcDxfEwvs6RCkMKZxNyd2ml8pqxrMWTsxsT4bdXUzI0JJP965+CYCxHN2hbmcCdSg8ZZ0T4n3Eo6Oyi1N289wT0SLbIDalU7Tj1NrPEhxkp+XOtxeZnHbjiZZhF5IniAtVnjqaJi6xYjUOgvNCCfqNhm6FZ4mx00xxwWNa9yy6JrI71Kjtqno5726nHX+v4HD7GCgUulJXivPNl43mUolWQAuGfE3T8dBUKyZFYTQ3azRJo+bh/kkd74AAFlXiiU1yokIZo8woXj21"
	const region = 'us-east-2'
	const policyName = 'Network_Perimeter_22222222222'
	const policyType = 'RESOURCE_CONTROL_POLICY'
	try{

		const attached = false
		const promise = togglePolicy(accessKeyId, secretAccessKey, sessionToken, policyName, policyType, attached)

	}catch (e){
		console.log(`Error in scp_scp_api main function:\n ${e}\n`)
		throw e
	}
}

if(require.main === module){
	main()
}


module.exports = {togglePolicy, isPolicyAttached}