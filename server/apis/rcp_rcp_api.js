const {
  OrganizationsClient,
  AttachPolicyCommand,
  DetachPolicyCommand,
  paginateListRoots,
  paginateListPoliciesForTarget,
  paginateListPolicies,
} = require("@aws-sdk/client-organizations");

// Helper function to handle pagination.
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
 * Returns the ID of the policy name specified.
 */
function findPolicy(policyName, policyList) {
  return policyList.find((policy) => policy.Name === policyName);
}

/**
 * Creates an AWS Organizations client.
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
 * Lists all policies of the specific type.
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

// Lists all the roots in the organization.
async function listRoots(client) {
  try {
    console.log("...Calling paginateListRoots...");
    return await getAllPaginatedResults(client, paginateListRoots, {});
  } catch (error) {
    console.error("Error listing roots:", error);
    throw error;
  }
}

/**
 * Lists all policies attached to a target.
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
 * Attaches a policy to a target.
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
 * Detaches a policy from a target.
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
      console.error(
        `Error detaching policy ${policyId} from target ${targetId}`
      );
      throw error;
    }
  }
}

/**
 * Toggles the RCP on or off.
 */
async function togglePolicy(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName,
  policyType = "RESOURCE_CONTROL_POLICY",
  attached
) {
  const region = "us-east-2";
  console.log(`...attempting to turn ${policyName} to ${attached}...`);
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
    );
    const allPolicies = await listAllPolicies(client, policyType);
    const targetPolicy = findPolicy(policyName, allPolicies);
    if (!targetPolicy) {
      console.log(`Policy named ${policyName} not found.`);
      return false;
    }
    const targetPolicyId = targetPolicy.Id;
    const roots = await listRoots(client);
    const rootId = roots[0].Id;
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
    const allPolicies = await listAllPolicies(client, policyType);
    const targetPolicy = findPolicy(policyName, allPolicies);
    if (!targetPolicy) {
      console.log(`Policy named ${policyName} not found.`);
      return false;
    }
    const targetPolicyId = targetPolicy.Id;
    const roots = await listRoots(client);
    const rootId = roots[0].Id;
    const attachedPolicies = await listPoliciesForTarget(
      rootId,
      client,
      policyType
    );
    return attachedPolicies.some((policy) => policy.Id === targetPolicyId);
  } catch (error) {
    console.error("Error: In checking if policy is attached:", error);
    return false;
  }
}

/*
// Removed local testing function to avoid hardcoded dummy credentials.
// For testing, please use environment variables or secure configuration.
*/

module.exports = { togglePolicy, isPolicyAttached };
