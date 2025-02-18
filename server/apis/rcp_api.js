const {
  OrganizationsClient,
  CreatePolicyCommand,
  DeletePolicyCommand,
  paginateListPolicies,
  ListRootsCommand,
  DescribeOrganizationCommand,
  DescribePolicyCommand,
} = require("@aws-sdk/client-organizations");
const { togglePolicy } = require("./rcp_rcp_api");

/**
 * Gets the organization ID.
 */
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

/**
 * Gets the root ID of the organization.
 */
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

/**
 * Gets the management account's path.
 */
async function getManagementAccountPath(
  accessKeyId,
  secretAccessKey,
  sessionToken
) {
  const region = "us-east-2";
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
    );
    const organizationId = await getOrganizationId(client);
    const rootId = await getRootId(client);
    return `${organizationId}/${rootId}/*`;
  } catch (error) {
    console.error("Error getting management account path:", error);
    throw error;
  }
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

/**
 * Returns the policy object with the given name.
 */
function findPolicy(policyName, policyList) {
  return policyList.find((policy) => policy.Name === policyName);
}

/**
 * Lists all policies of the specified type.
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

/**
 * Gets the Policy ID from the policy name.
 */
async function getPolicyIdFromName(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName
) {
  const region = "us-east-2";
  const policyType = "RESOURCE_CONTROL_POLICY";
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
    );
    const policies = await listAllPolicies(client, policyType);
    const targetPolicy = findPolicy(policyName, policies);
    if (!targetPolicy) {
      console.log(`Policy named ${policyName} not found.`);
      return undefined;
    }
    return targetPolicy.Id;
  } catch (e) {
    console.log("Error in getting policy id from name");
    throw e;
  }
}

/**
 * Creates an RCP.
 */
async function createRCP(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName,
  policyContent,
  description,
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
    const params = {
      Content: policyContent,
      Description: description,
      Name: policyName,
      Type: policyType,
    };
    const command = new CreatePolicyCommand(params);
    const response = await client.send(command);
    console.log("...Successfully created policy:", policyName, response);
    return true;
  } catch (error) {
    console.error("Error creating RCP:", error);
    console.log("Policy content:", policyContent);
    return false;
  }
}

/**
 * Creates network perimeter RCP dynamically using input parameters.
 * This function builds a policy document based on inputs.
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
  // For the VPC condition, use the first element if an array is provided.
  const vpcValue = Array.isArray(sourceVpcs) ? sourceVpcs[0] : sourceVpcs;
  const policyContent = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "EnforceNetworkPerimeter",
        Effect: effect,
        Principal: "*", // Required for RCP
        Action: action,
        Resource: resources,
        Condition: {
          StringNotEqualsIfExists: { "aws:SourceVpc": vpcValue },
          NotIpAddressIfExists: { "aws:SourceIp": sourceIps },
          // If needed, you can later add BoolIfExists and ArnNotLikeIfExists conditions
          BoolIfExists: {
            "aws:PrincipalIsAWSService": "false",
            "aws:ViaAWSService": "false",
          },
          ArnNotLikeIfExists: {
            "aws:PrincipalArn": "arn:aws:iam::*:role/aws:ec2-infrastructure",
          },
        },
      },
    ],
  });
  const description = "Network Perimeter RCP";
  const policyType = "RESOURCE_CONTROL_POLICY";
  return createRCP(
    accessKeyId,
    secretAccessKey,
    sessionToken,
    policyName,
    policyContent,
    description,
    policyType
  );
}

/**
 * Deletes an RCP.
 */
async function deleteRCP(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName
) {
  const region = "us-east-2";
  try {
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
      sessionToken,
      region
    );
    const params = { PolicyId: policyId };
    const command = new DeletePolicyCommand(params);
    await client.send(command);
    console.log(`...Successfully deleted policy: ${policyName}`);
    return true;
  } catch (error) {
    console.error("Error deleting RCP:", error);
    return false;
  }
}

/**
 * Gets the details of a specific RCP.
 */
async function getPolicyDetails(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyId
) {
  const region = "us-east-2";
  try {
    console.log(`...Getting policy ${policyId} details...`);
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region
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
 * Gets network perimeter info for RCP.
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
        statement.Condition?.NotIpAddressIfExists?.["aws:SourceIp"] || [],
      sourceVpcs:
        statement.Condition?.StringNotEqualsIfExists?.["aws:SourceVpc"] || [],
    };
  } catch (error) {
    console.error("Error extracting network perimeter info:", error);
    throw error;
  }
}

// Optional main function for local testing.
async function main() {
  const accessKeyId = "";
  const secretAccessKey = "";
  const sessionToken = "";
  const policyName = "Network_Perimeter_2";
  const effect = "Deny";
  const action = [
    "s3:*",
    "sqs:*",
    "kms:*",
    "secretsmanager:*",
    "sts:AssumeRole",
    "sts:DecodeAuthorizationMessage",
    "sts:GetAccessKeyInfo",
    "sts:GetFederationToken",
    "sts:GetServiceBearerToken",
    "sts:GetSessionToken",
    "sts:SetContext",
  ];
  const resources = ["*"];
  const sourceIps = [
    "76.34.219.165",
    "174.100.1.243",
    "75.102.78.202",
    "192.112.253.16",
    "75.102.64.1",
  ];
  const sourceVpcs = ["vpc-0abb2ff774c6768a9"];

  const info = await getNetworkPerimeter2Info(
    accessKeyId,
    secretAccessKey,
    sessionToken,
    policyName
  );
  await deleteRCP(accessKeyId, secretAccessKey, sessionToken, policyName);
  await createNetworkPerimeterRCP(
    accessKeyId,
    secretAccessKey,
    sessionToken,
    policyName,
    effect,
    action,
    resources,
    sourceIps,
    sourceVpcs
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  createNetworkPerimeterRCP,
  deleteRCP,
  getNetworkPerimeter2Info,
};
