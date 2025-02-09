
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
    return results
}

//Using credentials, a client organization is created
function createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region) {
    const credentials = { accessKeyId, secretAccessKey, sessionToken }
    return new OrganizationsClient({ credentials, region })
}

//attaches SCP
async function attachScp(policyId, targetId, client) {
    const params = { PolicyId: policyId, TargetId: targetId }
    try {
        const command = new AttachPolicyCommand(params);
        await client.send(command)
        console.log(`Successfully attached policy ${policyId} to target ${targetId}`)
    } catch (error) {
        console.error(`Error attaching policy ${policyId} to target ${targetId}:`, error)
        throw error
    }
}

//detaches scp
async function detachScp(policyId, targetId, client) {
    const params = { PolicyId: policyId, TargetId: targetId }
    try {
        const command = new DetachPolicyCommand(params)
        await client.send(command);
        console.log(`Successfully detached policy ${policyId} from target ${targetId}`)
    } catch (error) {
        console.error(`Error detaching policy ${policyId} from target ${targetId}:`, error)
        throw error;
    }
}

//gets all the target for the current SCP
async function listTargetsForScp(policyId, client) {
    try {
        return await getAllPaginatedResults(client, paginateListTargetsForPolicy, { PolicyId: policyId })
    } catch (error) {
        console.error(`Error listing targets for policy ${policyId}:`, error)
        throw error
    }
}

//This list all the SCPs attached to a target
async function listScpsForTarget(targetId, client, filter = "RESOURCE_CONTROL_POLICY") {
    try {
        return await getAllPaginatedResults(client, paginateListPoliciesForTarget, { TargetId: targetId, Filter: filter })
    } catch (error) {
        console.error(`Error listing policies for target ${targetId}:`, error)
        throw error;
    }
}

//This lists all the SCPs
async function listAllScps(client, filter = "RESOURCE_CONTROL_POLICY") {
    try {
        return await getAllPaginatedResults(client, paginateListPolicies, { Filter: filter })
    } catch (error) {
        console.error("Error listing all SCPs:", error)
        throw error
    }
}

//This lists all the roots in the organization
async function listRoots(client) {
    try {
        console.log("Calling paginateListRoots...")
        const result = await getAllPaginatedResults(client, paginateListRoots, {})
        console.log("paginateListRoots result:", result)
        return result;
    } catch (error) {
        console.error("Error listing roots:", error)
        throw error
    }
}
// main function for testing
/*
async function runExample() {
    const accessKeyId = 'ASIAYXWBOFS7VIKSFFG2'
    const secretAccessKey = 'X+Jw5hcWB8SLlv1Ujsgz1ZCJvO1TztDnvxT6M+WJ'
    const sessionToken =  'IQoJb3JpZ2luX2VjEGAaCXVzLWVhc3QtMiJIMEYCIQCyfTSPRo5b6DrNnsgyfMuzVYuHEpRXShX7aTlpuVPopQIhAIKB5RNn5Z9e6+7XK+foQfpE7Sl2FiypLtsH5mdy1ttzKsQECHoQABoMNjAwNjI3MzU4OTExIgwhVKOFP60aQT7+en4qoQT5SxA/nGqVZxUGRy7FZM5A5KiEtQjb4acMwj0fJgMl1rsySYmav2a+DDR8j94m7XfyGLAupymeHG7fMgxsfx4Pecy6eGjp0PcFBOEhdNZjVd9RuoNzHYuN/5QVEX6dBvw3Uv5QjZFYh10qlufxMOQy6reAepVxGxQKPbpy5SMB3wwnHWamnvyg1mzu37TZ/axafKpB4F21TPwKyfLeLSwM66HmJbT80cOTrwP/V/EiJ6OSnOWhSpRwDwsuR684iDftCyyy10tyE2r01ovAJ3q+eB8TKKSwYDGN3gefOxcsWCFJWOBzUAStvcasEIhBM9zWwfRbtDVOOuxgQ09Hs85xxygrIcsYQJiPW2RQGZZgvsW008yeW8xZmQcQf/6AmJUJbmmbVjp04UVzSn5cFDB5VYUstsSHzlkjmpKmW/SUu2p/hICiCbegUxfKAnKtlYVDTs80s0ORKwvLwp8UACfqB4sAmWHBPuDEiqcl9EmFkUyBay2NhJVFT1mSp3XuX/nlAi7dt25cG7l2BVVu4nYOvZMlaIveUa7UNP/HcV7pVI8GtTz3UYwEz2AW77UF2frGJxNwNMK36HeBer/dJw8Ozpe82BrBT3DkkXjQxkJTRarr6TRXImUlcrsX8ORlSC0v7gYFLydJZaimzMJ4AKTrgeqxJjCmzr9H++uSHUuBm7NV70iWpqhVgTBnzakrkBKlcqyZU6lwBi7zbmKPklsQ6TCP6Zi9BjqEArnLqklEIY6geCH6H80TmWEFy0wrJOWfszy8ECURkyN5P1eW9Ng1Y+sSKh5kJhVB37DKQhwlppKgagO4AY38s4eBHnvDflugYaFryrd61WufnBotvjvqtryXGrwIg4bitHaqdLYSd+HEqgrSOqcvfoUU9MdY8ZhAV4PQJFj0SbZUWpvOxeXgotl+N9Zpf8Papz0LKeracQcg9ZVzFBwaqA/Z2XFwcTXSkqgBprzlZ3GodM1qpStlgt5GVXiuGzGLNhViHylVJpz10lCkLcJSjqmvsy9XOnssc9My1l2dLp9MnL5N8gBZgV9JLmh8ZiwB6afzsg5B5bfY9bbY7MLHGx5mxMCB'; // Replace
    const region = "us-east-2"

    const client = createOrganizationsClient(accessKeyId, secretAccessKey, sessionToken, region)

    try {
        // --- List all available SCPs ---
        console.log("\nListing all SCPs:")
        const allScps = await listAllScps(client)
        allScps.forEach(policy => console.log(`  - ${policy.Name} (${policy.Id})`))

        if (allScps.length === 0) {
            console.log("No SCPs found.")
            return
        }

        // --- Find the "Network_Perimeter_1" policy ---
        const networkPerimeterPolicy = allScps.find(policy => policy.Name === "Network_Perimeter_2")

        if (!networkPerimeterPolicy) {
            console.error("Could not find the 'Network_Perimeter_2' policy.")
            return;
        }

        const policyIdToUse = networkPerimeterPolicy.Id
        console.log(`\nUsing policy ID: ${policyIdToUse}`)


        // --- List Roots ---
        const roots = await listRoots(client)
        if (!roots || roots.length === 0) {
            console.error("No roots found.  Ensure you are using the management account and have correct permissions (organizations:ListRoots).")
            return;
        }
        const targetIdToUse = roots[0].Id;
        console.log(`\nUsing target (Root) ID: ${targetIdToUse}`)

        // --- List SCPs attached to the target ---
        console.log(`\nListing SCPs attached to target ${targetIdToUse}:`)
        const attachedScps = await listScpsForTarget(targetIdToUse, client)
        attachedScps.forEach(policy => console.log(`  - ${policy.Name} (${policy.Id})`))

        /*
        // --- Attach the SCP ---
        await attachScp(policyIdToUse, targetIdToUse, client); // Corrected call

        // --- List SCPs attached to the target (again) ---
        console.log(`\nListing SCPs attached to target ${targetIdToUse} AFTER ATTACH:`)
        const attachedScpsAfter = await listScpsForTarget(targetIdToUse, client)
        attachedScpsAfter.forEach(policy => console.log(`  - ${policy.Name} (${policy.Id})`))

        // --- List targets for the SCP ---
        console.log(`\nListing targets for policy ${policyIdToUse}:`)
        const targets = await listTargetsForScp(policyIdToUse, client)
        targets.forEach(target => console.log(`  - ${target.Name} (${target.Id})`))



        // --- Detach the SCP ---
        await detachScp(policyIdToUse, targetIdToUse, client); // Corrected call

        // --- List SCPs attached to the target (again) ---
        console.log(`\nListing SCPs attached to target ${targetIdToUse} AFTER DETACH:`)
        const attachedScpsAfterDetach = await listScpsForTarget(targetIdToUse, client)
        attachedScpsAfterDetach.forEach(policy => console.log(`  - ${policy.Name} (${policy.Id})`))

    } catch (error) {
        console.error("An error occurred in the example:", error)
    } finally {
        client.destroy()
    }
}

runExample()
*/