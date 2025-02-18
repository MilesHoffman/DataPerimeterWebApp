const {
  OrganizationsClient,
  CreatePolicyCommand,
  DeletePolicyCommand,
  paginateListPolicies,
  ListRootsCommand,
  DescribePolicyCommand,
} = require("@aws-sdk/client-organizations");
const { togglePolicy } = require("./rcp_rcp_api");

const REGION = "us-east-2";

// Creates an Organizations client using provided credentials.
function createOrganizationsClient(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region = REGION
) {
  const credentials = { accessKeyId, secretAccessKey, sessionToken };
  return new OrganizationsClient({ credentials, region });
}

// Helper for pagination.
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

async function getPolicyIdFromName(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName
) {
  const policyType = "RESOURCE_CONTROL_POLICY";
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken
    );
    const policies = await getAllPaginatedResults(
      client,
      paginateListPolicies,
      { Filter: policyType }
    );
    const targetPolicy = policies.find((p) => p.Name === policyName);
    if (!targetPolicy) {
      console.log(`Policy named ${policyName} not found.`);
      return undefined;
    }
    return targetPolicy.Id;
  } catch (e) {
    console.error("Error in getting policy id from name:", e);
    throw e;
  }
}

async function getPolicyDetails(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyId
) {
  try {
    console.log(`...Getting details for policy ${policyId}...`);
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken
    );
    const params = { PolicyId: policyId };
    const command = new DescribePolicyCommand(params);
    const response = await client.send(command);
    console.log("...Successfully got policy details");
    return response.Policy;
  } catch (error) {
    console.error("Error describing policy:", error);
    throw error;
  }
}

/**
 * Creates the Network Perimeter RCP.
 * (Note: The policy content structure here mirrors that of SCP but includes a "Principal" field.)
 */
async function createNetworkPerimeterRCP(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName,
  effect,
  action,
  resources,
  sourceIps,
  sourceVpcs
) {
  const policyContent = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "EnforceNetworkPerimeter",
        Effect: effect,
        Principal: "*", // RCP policies require a Principal field
        Action: action,
        Resource: resources,
        Condition: {
          StringNotEqualsIfExists: { "aws:SourceVpc": sourceVpcs },
          NotIpAddressIfExists: { "aws:SourceIp": sourceIps },
          // (Additional conditions can be added here if needed)
        },
      },
    ],
  });
  const description = "Network Perimeter RCP";
  const policyTypeFinal = "RESOURCE_CONTROL_POLICY";
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken
    );
    const params = {
      Content: policyContent,
      Description: description,
      Name: policyName,
      Type: policyTypeFinal,
    };
    const command = new CreatePolicyCommand(params);
    const response = await client.send(command);
    console.log("...Successfully created RCP:", policyName, response);
    return true;
  } catch (error) {
    console.error("Error creating RCP:", error);
    return false;
  }
}

/**
 * Deletes the RCP with the specified policy name.
 */
async function deleteRCP(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName
) {
  try {
    // First, toggle the policy off (detach it from the root)
    await togglePolicy(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      "RESOURCE_CONTROL_POLICY",
      false
    );
    const policyId = await getPolicyIdFromName(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName
    );
    if (!policyId) {
      console.log("...could not find policy id, so cannot delete...");
      return false;
    }
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken
    );
    const params = { PolicyId: policyId };
    const command = new DeletePolicyCommand(params);
    await client.send(command);
    console.log(`...Successfully deleted RCP: ${policyName}`);
    return true;
  } catch (error) {
    console.error("Error deleting RCP:", error);
    return false;
  }
}

/**
 * Retrieves the Network Perimeter RCP information.
 * This function mirrors the SCP version by parsing the policy's JSON content.
 */
async function getNetworkPerimeter2Info(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName
) {
  try {
    console.log(`...Getting ${policyName} details...`);
    const policyId = await getPolicyIdFromName(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName
    );
    if (!policyId) {
      throw new Error("Policy not found");
    }
    const policyDetails = await getPolicyDetails(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyId
    );
    const policyContent = JSON.parse(policyDetails.Content);
    const statement = policyContent.Statement[0];
    return {
      policyName,
      sid: statement.Sid,
      effect: statement.Effect,
      action: Array.isArray(statement.Action)
        ? statement.Action
        : [statement.Action],
      resources: Array.isArray(statement.Resource)
        ? statement.Resource
        : [statement.Resource],
      sourceIps:
        statement.Condition && statement.Condition.NotIpAddressIfExists
          ? statement.Condition.NotIpAddressIfExists["aws:SourceIp"]
          : [],
      sourceVpcs:
        statement.Condition && statement.Condition.StringNotEqualsIfExists
          ? statement.Condition.StringNotEqualsIfExists["aws:SourceVpc"]
          : [],
    };
  } catch (error) {
    console.error("Error extracting network perimeter RCP info:", error);
    throw error;
  }
}

module.exports = {
  createNetworkPerimeterRCP,
  deleteRCP,
  getNetworkPerimeter2Info,
};
