const {
  OrganizationsClient,
  AttachPolicyCommand,
  DetachPolicyCommand,
  paginateListRoots,
  paginateListPoliciesForTarget,
  paginateListPolicies,
} = require("@aws-sdk/client-organizations");

//Helper function to handle pagination.
async function getAllPaginatedResults(client, paginatorFunction, params) {
  const results = [];
  for await (const page of paginatorFunction({ client }, params)) {
    const itemsKey = Object.keys(page).find((key) => Array.isArray(page[key]));
    if (itemsKey) {
      results.push(...page[itemsKey]);
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
  return policyList.find((policy) => policy.Name === policyName);
}

/**
 * Using credentials, a client organization is created. Gives the ability to interact with scp or rcp
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param region
 * @returns {OrganizationsClient}
 */
function createOrganizationsClient(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region
) {
  const credentials = { accessKeyId, secretAccessKey, sessionToken };
  return new OrganizationsClient({ credentials, region });
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
    console.log("...getting a list of all policies...");
    return await getAllPaginatedResults(client, paginateListPolicies, {
      Filter: filter,
    });
  } catch (error) {
    console.error("Error listing all policies:");
    throw error;
  }
}

//This lists all the roots in the organization
async function listRoots(client) {
  try {
    console.log("...Calling paginateListRoots...");
    const result = await getAllPaginatedResults(client, paginateListRoots, {});
    return result;
  } catch (error) {
    console.error("Error listing roots:");
    throw error;
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
    return await getAllPaginatedResults(client, paginateListPoliciesForTarget, {
      TargetId: targetId,
      Filter: filter,
    });
  } catch (error) {
    console.error(`Error listing policies for target ${targetId}`);
    throw error;
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
  const params = { PolicyId: policyId, TargetId: targetId };
  try {
    console.log("...attempting to attach policy...");
    const command = new AttachPolicyCommand(params);
    await client.send(command);
    console.log(
      `...Successfully attached policy ${policyId} to target ${targetId}`
    );
  } catch (error) {
    if (error.__type === "DuplicatePolicyAttachmentException") {
      console.log("...policy is already attached...");
    } else {
      console.error(`Error attaching policy ${policyId} to target ${targetId}`);
      throw error;
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
  const params = { PolicyId: policyId, TargetId: targetId };
  try {
    console.log(`...attempting to detach ${policyId}...`);
    const command = new DetachPolicyCommand(params);
    await client.send(command);
    console.log(
      `...Successfully detached policy ${policyId} from target ${targetId}`
    );
  } catch (error) {
    if (error.__type === "PolicyNotAttachedException") {
      console.log("...policy is already detached...");
    } else {
      console.error(`Error detaching policy ${policyId} to target ${targetId}`);
      throw error;
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
  sessionToken,
  policyName,
  policyType = "RESOURCE_CONTROL_POLICY" || "SERVICE_CONTROL_POLICY",
  attached
) {
  const region = "use-east-2";

  console.log(`...attempting process to turn ${policyName} to ${attached}...`);

  try {
    // Creating the client
    const client = await createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
    );

    // Getting list of policies
    const allPolices = await listAllPolicies(client, policyType);

    // Getting target policy ID
    const targetPolicyId = findPolicy(policyName, allPolices).Id;

    // Getting the IDs of the org
    const roots = await listRoots(client);

    // Getting the root ID of the org
    const rootId = roots[0].Id; // Essentially the root of the org

    // Attaching or detaching  the policy
    attached
      ? await attachPolicy(targetPolicyId, rootId, client)
      : await detachPolicy(targetPolicyId, rootId, client);

    return true;
  } catch (e) {
    console.log(`Error in togglePolicy function:\n ${e}\n`);
    return false;
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
async function isPolicyAttached(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName,
  policyType
) {
  const region = "us-east-2";

  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
    );

    // Get list of all policies of the specified type
    const allPolicies = await listAllPolicies(client, policyType);

    // Find the target policy by name
    const targetPolicy = findPolicy(policyName, allPolicies);
    if (!targetPolicy) {
      console.log(`Policy named ${policyName} not found.`);
      return false; // Policy doesn't exist, so it's not attached
    }
    const targetPolicyId = targetPolicy.Id;

    // Get the root ID
    const roots = await listRoots(client);
    const rootId = roots[0].Id;

    // List policies attached to the root
    const attachedPolicies = await listPoliciesForTarget(
      rootId,
      client,
      policyType
    );

    // Check if the target policy is in the list of attached policies
    return attachedPolicies.some((policy) => policy.Id === targetPolicyId);
  } catch (error) {
    console.error("Error: In checking if policy is attached:", error);
    return false;
  }
}

async function main() {
  const accessKeyId = "";
  const secretAccessKey = "";
  const sessionToken = "";

  const region = "us-east-2";
  const policyName = "Network_Perimeter_22222222222";
  const policyType = "RESOURCE_CONTROL_POLICY";
  try {
    const attached = false;
    const promise = togglePolicy(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType,
      attached
    );
  } catch (e) {
    console.log(`Error in scp_scp_api main function:\n ${e}\n`);
    throw e;
  }
}

if (require.main === module) {
  main();
}

module.exports = { togglePolicy, isPolicyAttached };
