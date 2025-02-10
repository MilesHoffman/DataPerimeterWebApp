const { OrganizationsClient, AttachPolicyCommand } = require("@aws-sdk/client-organizations")
const {  DetachPolicyCommand, ListTargetsForPolicyCommand, ListPoliciesForTargetCommand, paginateListRoots,paginateListPoliciesForTarget, paginateListPolicies, paginateListTargetsForPolicy } = require("@aws-sdk/client-organizations")


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
		console.error("Error listing all SCPs:", error)
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
		console.error("Error listing roots:", error)
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
		console.error(`Error listing policies for target ${targetId}:`, error)
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
			console.error(`Error attaching policy ${policyId} to target ${targetId}:`, error)
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
			console.error(`Error detaching policy ${policyId} to target ${targetId}:`, error)
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
 * @returns {Promise<void>}
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

	}catch (e){
		console.log(`Error in togglePolicy function:\n ${e}\n`)
		throw e
	}
}

async function main() {

	const accessKeyId = "ASIAYXWBOFS7TAMDW376"; // Replace
	const secretAccessKey = "sVylPUZuzVVGyCRYcVIyh6PzRJYZ/skbuUuZr1Ok"; // Replace
	const sessionToken =  "IQoJb3JpZ2luX2VjEKn//////////wEaCXVzLWVhc3QtMiJHMEUCIHNijsJIVMDpq0qDshNg//Yr84CBznNqT3dIFYQWmcgXAiEAlmWZDXgDVgk/GzSOSmR5R7RlluN/z4c7JaY0IIelz5sqzQQIwv//////////ARAAGgw2MDA2MjczNTg5MTEiDCBVgxb7MQ0fNwVgGSqhBGNEdibEfkewMu2h79KjJaR9bmMuYjvtziMNSfF0M3zw0d1Y0Ja2d2Miml9/5vXCyH7uuzBw13udzzG9mN6LPSVFjd9pOGilJiAHOqudFN3Ulk5ZjgvvcqHnm8S8CDes9NedT6zvnWQFmiyYa/re61NYQHKw6iz59dp+4O/mWt8oBgRHzAv34dl3OyCM6iM/cSOMRfrSxrhhixRQCdIhxwDGqGSqYTZHTe1fXVK3Kbm7Knt/EcPtqRZ5h4C8FhAsvZRsKJsiDHFXZmTAxgTvS0zfRL7bs5+qjDt51Df8RkNyv27SBOSQSsO+rE1v0z05ABzDtWtzq6Ib93eABaZUZP4vY9vKrhkcjB8g7lOMkMVad2/BvmHkC/EFHlYNNhDBs8/tlWDOisMxSW9ZgnWJTwo5tXmuc3ryQfOSijzxAQyDoeDN880IQmtkXr7+5sirs3FWjJPeqanPB1OTjn+7pxQl78fEKVdHPRcAqGw3O1caSAdYHcc+95CFemtz9b1fPHNYOvgWCFhMRWJRqfxmHuH8kUz+dYo8OeLnOe8BCeA2G27EkcXCICY1lNNZ1o9UEpZ4fKwjzuOXoS9lyAkKDd5FFbvA3Edi+8rxUnltpNg2ZO/NNNimvq8vAoTNeYzavxxbCAlx9hJljt/Dsnd3VXrFmDPo0YCSo5aHVJQl/bMElgv+btd05hRW82ajb4rVobPelbOCYKjiS4c4cNRA/0T3MMbVqL0GOoUCsocpUpFh6wUVAgnWsp7L3147FEJ6DNioqlhkjKSo58aWigKb2vChZRRVrEAghzki7wKn6tr/IUXTGF6qmPCYOW6EqjHNsMXA1VhOl4lTlA6O5vDJ45rcoxT1wCpmFR3pisQAfX1Zd+9/M5/j9KAJkp4jnF3tlFGT9Z/eGFQmZzY0py8L6g889VTnztA4hrOGvz06AbzlYS/zACJQeROc/menWLL12B9IQW6bmQCReIIlvzevhN/Q3SQzPx/Iy5UYOQ3KIFF1irjXTYOCmDVMWD+dJb+QEICAi2Ymje9TUDZThJfl/dkErIfi6+NCi4+VhKpqqwWEbjvWaFmMu8pUl0PIjWVr"

	const region = 'us-east-2'
	const policyName = 'Network_Perimeter_2'
	const policyType = 'RESOURCE_CONTROL_POLICY'
	try{

		const attached = false
		togglePolicy(accessKeyId, secretAccessKey, sessionToken, policyName, policyType, attached)

	}catch (e){
		console.log(`Error in scp_scp_api main function:\n ${e}\n`)
		throw e
	}
}

main()