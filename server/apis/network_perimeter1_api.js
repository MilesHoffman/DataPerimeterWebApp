const {
  OrganizationsClient,
  AttachPolicyCommand,
} = require("@aws-sdk/client-organizations");
const {
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

// Attaches an SCP.
async function attachScp(policyId, targetId, client) {
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

// Detaches an SCP.
async function detachScp(policyId, targetId, client) {
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

// Gets all targets for the current SCP.
async function listTargetsForScp(policyId, client) {
  try {
    return await getAllPaginatedResults(client, paginateListTargetsForPolicy, {
      PolicyId: policyId,
    });
  } catch (error) {
    console.error(`Error listing targets for policy ${policyId}:`, error);
    throw error;
  }
}

// Lists all SCPs attached to a target.
async function listScpsForTarget(
  targetId,
  client,
  filter = "SERVICE_CONTROL_POLICY"
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

// Lists all SCPs.
async function listAllScps(client, filter = "SERVICE_CONTROL_POLICY") {
  try {
    return await getAllPaginatedResults(client, paginateListPolicies, {
      Filter: filter,
    });
  } catch (error) {
    console.error("Error listing all SCPs:", error);
    throw error;
  }
}

// Lists all the roots in the organization.
async function listRoots(client) {
  try {
    console.log("Calling paginateListRoots...");
    const result = await getAllPaginatedResults(client, paginateListRoots, {});
    console.log("paginateListRoots result:", result);
    return result;
  } catch (error) {
    console.error("Error listing roots:", error);
    throw error;
  }
}

module.exports = {
  attachScp,
  detachScp,
  listTargetsForScp,
  listScpsForTarget,
  listAllScps,
  listRoots,
};
