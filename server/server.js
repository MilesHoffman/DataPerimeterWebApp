/**
 * Express server for handling user authentication with Cognito,
 * S3 resource management, compliance checking, and policy endpoints
 * (both SCP for Network Perimeter 1 and RCP for Network Perimeter 2).
 */

const express = require("express");
const fileUpload = require('express-fileupload')
const cors = require("cors");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const {readFileSync} = require("node:fs");
const { exec } = require("child_process"); //for EC2 CLI

// Import Cognito functions
const {authenticateUser, getAWSCredentials} = require("./apis/cognito_api");

const {
	getS3Resources,
	addS3Resource,
	getProfileCompliance,
	listAllBucketsAndContents,
	removeS3Resource, sendS3Resource,
} = require("./apis/resource_api");


const {
	togglePolicy,
	isPolicyAttached,
	getPolicyIdFromName,
	getNetworkPerimeter1Info,
	updatePolicyContent,
	getNetworkPerimeter2Info
} = require("./apis/scp_rcp_api");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so our React app can call this API
app.use(cors());
// Parse JSON request bodies
app.use(bodyParser.json());

app.use(fileUpload())

/**
 * Login endpoint - authenticates user via Cognito and retrieves AWS credentials.
 */
app.post("/api/login", async (req, res) => {
	const {username, password, identityPoolId, userPoolId, clientId} = req.body;
	console.log("Received login request:", {username});

	try {
		const tokens = await authenticateUser(username, password, clientId);
		console.log("Cognito authentication successful");

		tokens.userPoolId = userPoolId;
		const poolData = {UserPoolId: userPoolId, ClientId: clientId};

		try {
			const credentials = await getAWSCredentials(
				tokens.idToken,
				poolData,
				identityPoolId,
				"us-east-2"
			);
			tokens.accessKeyId = credentials.accessKeyId;
			tokens.secretAccessKey = credentials.secretAccessKey;
			tokens.sessionToken = credentials.sessionToken;
			console.log("AWS Credentials retrieved");
		} catch (error) {
			console.error("Error retrieving AWS credentials:", error);
		}

		console.log("Sending tokens back to client");
		res.json(tokens);
	} catch (error) {
		console.error("Error during login:", error);
		res.status(500).json({
			message: "Login failed",
			error: error.message || error.toString(),
		});
	}
});

/**
 * S3 Resource Endpoints
 */

// Fetch S3 resources from a bucket
app.post("/api/resource", async (req, res) => {
	const region = "us-east-2";
	const {accessKeyId, secretAccessKey, sessionToken, bucketName} = req.body;
	const credentials = {accessKeyId, secretAccessKey, sessionToken};
	const profile = {region, credentials, bucketName};

	console.log("Fetching S3 resources...");
	try {
		const resourceData = await getS3Resources(profile);
		console.log("Resources fetched.");
		res.json(resourceData);
	} catch (error) {
		console.error("Error fetching S3 resources:", error);
		res
			.status(500)
			.json({message: "Error fetching resources", error: error.message});
	}
});

// Delete an S3 resource (object)
app.post("/api/resource/delete", async (req, res) => {
	const region = "us-east-2";
	const {accessKeyId, secretAccessKey, sessionToken, bucketName, objectKey} =
		req.body;
	if (!objectKey) {
		return res.status(400).json({message: "Object key is required."});
	}
	const credentials = {accessKeyId, secretAccessKey, sessionToken};
	const profile = {region, credentials, bucketName};

	console.log("Deleting resource:", objectKey);
	try {
		const deleteResult = await removeS3Resource(profile, bucketName, objectKey);
		res.json(deleteResult);
	} catch (error) {
		console.error("Error deleting resource:", error);
		res
			.status(500)
			.json({message: "Error deleting resource", error: error.message});
	}
});

// Add (upload) an S3 resource to a bucket
app.post("/api/resource/add", async (req, res) => {
	try {
		console.log("Entering resource add endpoint");
		const region = "us-east-2";

		const accessKeyId = req.body.accessKeyId;
		const secretAccessKey = req.body.secretAccessKey;
		const sessionToken = req.body.sessionToken;
		const bucketName = req.body.bucketName;
		const filePath = req.body.filePath
		const file = req.files.file

		if (!file) {
			return res
				.status(400)
				.json({ success: false, message: "File is required." })
		}

		const credentials = { accessKeyId, secretAccessKey, sessionToken };
		const profile = { region, credentials, bucketName };

		console.log("Selected file: ", file);

		const path = require("path");

		const fileNameWithExt = file.name
		const extName = path.extname(fileNameWithExt);
		let contentType = "";
		switch (extName.toLowerCase()) {
			case ".jpg":
			case ".jpeg":
				contentType = "image/jpeg";
				break;
			case ".png":
				contentType = "image/png";
				break;
			case ".txt":
				contentType = "text/plain";
				break;
			default:
				contentType = "application/octet-stream"
		}

		console.log("Uploading to S3...");
		const addResult = await addS3Resource(
			profile,
			bucketName,
			fileNameWithExt,
			file.data,
			contentType
		);

		console.log("Resource add completed.");
		res.json(addResult.success);

	} catch (error) {
		console.error("Error in /api/resource/add:", error);
		res
			.status(500)
			.json({ success: false, message: "Server error: " + error.message });
	}
})

/**
 * Policy Endpoints
 */

// Attach a policy (turn it on)
app.post("/api/perimeter/attach", async (req, res) => {
	try {
		const {
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType,
		} = req.body;

		const result = await togglePolicy(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType,
			true
		);
		res.json({success: result});
	} catch (error) {
		console.error("Error in attach call:", error);
		res.json({success: false});
	}
});

// Detach a policy (turn it off)
app.post("/api/perimeter/detach", async (req, res) => {
	try {
		const {
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType,
		} = req.body;
		const result = await togglePolicy(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType,
			false
		);
		res.json({success: result});
	} catch (error) {
		console.error("Error in detach call:", error);
		res.json({success: false});
	}
});

// Check if a policy is attached
app.post("/api/perimeter/check", async (req, res) => {
	try {
		const {
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType,
		} = req.body;
		const result = await isPolicyAttached(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType
		);
		res.json({attached: result.attached, error: result.error});

	} catch (error) {
		console.error("Error in checking if policy is attached:", error);
		res.json({attached: false, error: true});
	}
});

/**
 * Modify Network Perimeter SCP (Network Perimeter 1) endpoint.
 * Deletes the existing SCP (if present) and creates a new one.
 */
app.post("/api/perimeter/modifyNetwork1", async (req, res) => {
	try {
		const {
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			effect,
			action,
			resources,
			sourceIps,
			sourceVpcs,
		} = req.body;

		console.log(`Attempting to modify SCP: ${policyName}`);

		// Find the existing policy id
		const policyId = await getPolicyIdFromName(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			"SERVICE_CONTROL_POLICY"
		);

		// make new policy content
		if(action.includes("*")){
			console.error("Refusing to modify SCP with wildcard action '*'")
			return res.json({ success: false, message: "Wildcard action '*' is not allowed for safety." });
		}

		// Creating new content
		const newPolicyContent = JSON.stringify({
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "NetworkPerimeterOnIdentities",
					"Effect": effect,
					"Action": action,
					"Resource": resources,
					"Condition": {
						"NotIpAddressIfExists": {
							"aws:SourceIp": sourceIps
						},
						"StringNotEqualsIfExists": {
							"aws:SourceVpc": sourceVpcs
						}
					}
				}
			]
		});
		const description = "Network Perimeter 1 denies s3 actions when on an untrusted VPC or IP.";

		let success = false;
		if (policyId) {
			console.log(`Policy ${policyName} found (ID: ${policyId}). Updating content...`);
			success = await updatePolicyContent(
				accessKeyId,
				secretAccessKey,
				sessionToken,
				policyId,
				newPolicyContent,
				policyName,
				description
			);
			res.json({ success: success });

		}
		else{
			res.json({ success: false, message: "No policy ID" });
		}
	} catch (error) {
		console.error("Error in modifying network perimeter SCP:", error);
		res.json({ success: false, message: error.message || "Unknown server error" });
	}
});


/**
 * Get Network Perimeter SCP Info endpoint.
 */
app.post("/api/perimeter/getNetwork1Info", async (req, res) => {
	try {
		const {accessKeyId, secretAccessKey, sessionToken, policyName} = req.body;
		const policyInfo = await getNetworkPerimeter1Info(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName
		);
		if (!policyInfo) {
			return res.json({
				success: false,
				message: `Policy named ${policyName} not found.`,
			});
		}
		res.json({success: true, ...policyInfo});
	} catch (error) {
		console.error("Error in getting network perimeter info:", error);
		res.json({success: false, error: error.message});
	}
});

/**
 * Modify Network Perimeter RCP (Network Perimeter 2) endpoint.
 * Deletes the existing RCP (if present) and creates a new one.
 */
app.post("/api/perimeter/modifyNetwork2", async (req, res) => {
	try {
		const {
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			effect,
			action,
			resources,
			sourceIps,
			sourceVpcs,
		} = req.body;

		const policyType = 'RESOURCE_CONTROL_POLICY'

		console.log(`Attempting to modify RCP: ${policyName}`);

		const policyId = await getPolicyIdFromName(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName,
			policyType
		)

		// safety check
		if(action.includes("*")){
		   console.error("Refusing to modify RCP with wildcard action '*'")
		   return res.json({ success: false, message: "Wildcard action '*' might be disallowed." });
		}

		// Create the new policy content
		const newPolicyContent = JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "NetworkPerimeterOnIdentities",
					Effect: effect,
					Principal: "*",
					Action: action,
					Resource: resources,
					Condition: {
						StringNotEqualsIfExists: { "aws:SourceVpc": sourceVpcs },
						NotIpAddressIfExists: { "aws:SourceIp": sourceIps },
					},
				},
			],
		});

		const description = "Network Perimeter 2 denies s3 actions when on an untrusted VPC or IP."

		let success = false;
		if (policyId) {
			console.log(`Policy <span class="math-inline">\{policyName\} \(</span>{policyType}) found (ID: ${policyId}). Updating content...`);
			success = await updatePolicyContent( // Use generalized function
				accessKeyId,
				secretAccessKey,
				sessionToken,
				policyId,
				newPolicyContent,
				policyName,
				description
			);
			res.json({ success: success });

		} else {
			// Policy not found, return error
			res.json({ success: false, message: "No policy ID found for " + policyName});
		}
	} catch (error) {
		console.error("Error in modifying network perimeter RCP:", error);
		res.json({ success: false, message: error.message || "Unknown server error" });
	}

});

/**
 * Get Network Perimeter RCP Info endpoint.
 */
app.post("/api/perimeter/getNetwork2Info", async (req, res) => {
	try {
		const {accessKeyId, secretAccessKey, sessionToken, policyName} = req.body;
		const policyInfo = await getNetworkPerimeter2Info(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			policyName
		);
		if (!policyInfo) {
			return res.json({
				success: false,
				message: `Policy named ${policyName} not found.`,
			});
		}
		res.json({success: true, ...policyInfo});
	} catch (error) {
		console.error("Error in getting network perimeter RCP info:", error);
		res.json({success: false, error: error.message});
	}
});

/**
 * Compliance Check endpoint.
 */
app.post("/api/compliance_check", async (req, res) => {
	try {
		const {accessKeyId, secretAccessKey, sessionToken, bucketName} = req.body;

		const complianceStatus = await getProfileCompliance(
			accessKeyId,
			secretAccessKey,
			sessionToken,
			bucketName
		);

		console.log("API Compliance Result:", complianceStatus.compliant);
		res.status(200).json(complianceStatus.compliant);
	} catch (error) {
		console.error("Error checking compliance:", error);
		res.status(500).json({
			message: "Server error",
			error: error.message || "Unknown error",
		});
	}
});

/**
 * List S3 Buckets endpoint.
 */
app.post("/api/buckets_list", async (req, res) => {
	const region = "us-east-2";
	const {accessKeyId, secretAccessKey, sessionToken} = req.body;
	if (!accessKeyId || !secretAccessKey || !sessionToken) {
		return res.status(400).json({error: "Missing AWS credentials"});
	}
	const s3 = new AWS.S3({accessKeyId, secretAccessKey, sessionToken, region});
	try {
		console.log("Fetching S3 bucket list...");
		const bucketsResponse = await s3.listBuckets().promise();
		const bucketDetails = await Promise.all(
			bucketsResponse.Buckets.map(async (bucket) => {
				try {
					const objects = await s3
						.listObjectsV2({Bucket: bucket.Name})
						.promise();
					return {
						name: bucket.Name,
						creationDate: bucket.CreationDate,
						objectCount: objects.KeyCount || 0,
					};
				} catch (error) {
					console.error(`Error listing objects for ${bucket.Name}:`, error);
					return {
						name: bucket.Name,
						creationDate: bucket.CreationDate,
						objectCount: "Unknown",
					};
				}
			})
		);
		console.log("Successfully fetched bucket list.");
		res.json({buckets: bucketDetails});
	} catch (error) {
		console.error("Error fetching buckets:", error);
		res.status(500).json({error: "Failed to fetch buckets"});
	}
});

app.post('/api/resources/send', async (req, res) => {
	try{
		const {accessKeyId, secretAccessKey, sessionToken,
			sourceBucketName, destinationBucketName, objectName, objectType } = req.body;

		const success = await sendS3Resource(
			accessKeyId, secretAccessKey, sessionToken,
			sourceBucketName, destinationBucketName, objectName, objectType
		)

		res.json(success)
	}
	catch (error){
		console.log('Error in resource send: ', error)
	}
})

app.post("/api/cli", async (req, res) => {
	const { accessKeyId, secretAccessKey, sessionToken, command } = req.body;

	if (!command || typeof command !== 'string') {
		return res.status(400).json({ error: "Invalid or missing command" });
	}

	console.log(`Executing CLI command: aws ${command}`);

	// Inject environment variables securely
	const envVars = {
		AWS_ACCESS_KEY_ID: accessKeyId,
		AWS_SECRET_ACCESS_KEY: secretAccessKey,
		AWS_SESSION_TOKEN: sessionToken,
		AWS_DEFAULT_REGION: "us-east-2"
	};

	// Build and run command
	exec(`aws ${command}`, { env: { ...process.env, ...envVars } }, (error, stdout, stderr) => {
		if (error) {
			console.error("CLI command failed:", stderr || error.message);
			return res.status(500).json({ success: false, error: stderr || error.message });
		}

		res.json({ success: true, output: stdout });
	});
});

// --------------------- START THE SERVER ---------------------

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
