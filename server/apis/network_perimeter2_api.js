const {
  OrganizationsClient,
  AttachPolicyCommand,
  DetachPolicyCommand,
  ListTargetsForPolicyCommand,
  ListPoliciesForTargetCommand,
  paginateListRoots,
  paginateListPoliciesForTarget,
  paginateListPolicies,
  paginateListTargetsForPolicy,
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

// Creates an AWS Organizations client.
function createOrganizationsClient(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region
) {
  const credentials = { accessKeyId, secretAccessKey, sessionToken };
  return new OrganizationsClient({ credentials, region });
}

// Attaches an RCP to a target.
async function attachRcp(policyId, targetId, client) {
  const params = { PolicyId: policyId, TargetId: targetId };
  try {
    const command = new AttachPolicyCommand(params);
    await client.send(command);
    console.log(
      `Successfully attached policy ${policyId} to target ${targetId}`
    );
  } catch (error) {
    console.error(
      `Error attaching policy ${policyId} to target ${targetId}:`,
      error
    );
    throw error;
  }
}

// Detaches an RCP from a target.
async function detachRcp(policyId, targetId, client) {
  const params = { PolicyId: policyId, TargetId: targetId };
  try {
    const command = new DetachPolicyCommand(params);
    await client.send(command);
    console.log(
      `Successfully detached policy ${policyId} from target ${targetId}`
    );
  } catch (error) {
    console.error(
      `Error detaching policy ${policyId} from target ${targetId}:`,
      error
    );
    throw error;
  }
}

// Gets all targets for the current RCP.
async function listTargetsForRcp(policyId, client) {
  try {
    return await getAllPaginatedResults(client, paginateListTargetsForPolicy, {
      PolicyId: policyId,
    });
  } catch (error) {
    console.error(`Error listing targets for policy ${policyId}:`, error);
    throw error;
  }
}

// Lists all RCPs attached to a target.
async function listRcpsForTarget(
  targetId,
  client,
  filter = "RESOURCE_CONTROL_POLICY"
) {
  try {
    return await getAllPaginatedResults(client, paginateListPoliciesForTarget, {
      TargetId: targetId,
      Filter: filter,
    });
  } catch (error) {
    console.error(`Error listing policies for target ${targetId}:`, error);
    throw error;
  }
}

// Lists all RCPs.
async function listAllRcps(client, filter = "RESOURCE_CONTROL_POLICY") {
  try {
    return await getAllPaginatedResults(client, paginateListPolicies, {
      Filter: filter,
    });
  } catch (error) {
    console.error("Error listing all RCPs:", error);
    throw error;
  }
}

// Lists all roots in the organization.
async function listRoots(client) {
  try {
    console.log("Calling paginateListRoots...");
    return await getAllPaginatedResults(client, paginateListRoots, {});
  } catch (error) {
    console.error("Error listing roots:", error);
    throw error;
  }
}

/*
// Removed local testing example to prevent accidental inclusion of credentials.
// Use your API endpoints to call these functions.
*/

module.exports = {
  attachRcp,
  detachRcp,
  listTargetsForRcp,
  listRcpsForTarget,
  listAllRcps,
  listRoots,
};
