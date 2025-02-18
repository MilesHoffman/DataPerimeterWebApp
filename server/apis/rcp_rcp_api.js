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

function findPolicy(policyName, policyList) {
  return policyList.find((policy) => policy.Name === policyName);
}

function createOrganizationsClient(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region
) {
  const credentials = { accessKeyId, secretAccessKey, sessionToken };
  return new OrganizationsClient({ credentials, region });
}

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

async function listRoots(client) {
  try {
    console.log("...Calling paginateListRoots...");
    return await getAllPaginatedResults(client, paginateListRoots, {});
  } catch (error) {
    console.error("Error listing roots:", error);
    throw error;
  }
}

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

async function togglePolicy(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName,
  policyType = "RESOURCE_CONTROL_POLICY",
  attached
) {
  const REGION = "us-east-2"; // Corrected region string
  console.log(
    `...attempting to turn ${policyName} ${attached ? "on" : "off"}...`
  );
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      REGION
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
    if (attached) {
      await attachPolicy(targetPolicyId, rootId, client);
    } else {
      await detachPolicy(targetPolicyId, rootId, client);
    }
    return true;
  } catch (e) {
    console.error(`Error in togglePolicy function:\n ${e}`);
    return false;
  }
}

async function isPolicyAttached(
  accessKeyId,
  secretAccessKey,
  sessionToken,
  policyName,
  policyType
) {
  const REGION = "us-east-2";
  try {
    const client = createOrganizationsClient(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      REGION
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
    console.error("Error in checking if policy is attached:", error);
    return false;
  }
}

module.exports = { togglePolicy, isPolicyAttached };
