/**
 * Express server for handling user authentication with Cognito.
 * This file sets up API endpoints for login, compliance checking, and S3 resource management.
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");

// Import necessary functions
const {
	authenticateUser,
	getAWSCredentials,
} = require("./apis/cognito_api");
const { getS3Resources, addS3Resource, getProfileCompliance } = require("./apis/resource_api");
const { readFileSync } = require("node:fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

/** 🔹 Compliance Check API - Checks Profile Credentials */
app.post("/api/compliance_check", async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, sessionToken } = req.body;

        if (!accessKeyId || !secretAccessKey || !sessionToken) {
            return res.status(400).json({ message: "Missing AWS credentials." });
        }

        // Masking accessKeyId for security in logs
        const maskedAccessKey = accessKeyId.replace(/.(?=.{4})/g, "*");
        console.log(`Checking compliance for Access Key: ${maskedAccessKey}`);

        const complianceStatus = await getProfileCompliance(accessKeyId, secretAccessKey, sessionToken);

        if (!complianceStatus || typeof complianceStatus.compliant === "undefined") {
            console.error("Invalid API response from getProfileCompliance:", complianceStatus);
            return res.status(500).json({ message: "Internal server error: Invalid response from compliance check" });
        }

        console.log("API Compliance Result:", complianceStatus);
        return res.status(200).json(complianceStatus);
    } catch (error) {
        console.error("Error checking compliance:", error);
        return res.status(500).json({ message: "Server error", error: error.message || "Unknown error" });
    }
});



/** 🔹 Login API - Authenticates User with Cognito */
app.post("/api/login", async (req, res) => {
	const { username, password, identityPoolId, userPoolId, clientId } = req.body;
	console.log("Received login request:", { username });

	try {
		// Authenticate user
		const tokens = await authenticateUser(username, password, clientId);
		console.log("Cognito authentication successful:", tokens);

		tokens.userPoolId = userPoolId;
		const poolData = { UserPoolId: userPoolId, ClientId: clientId };

		// Get AWS credentials
		try {
			const credentials = await getAWSCredentials(tokens.idToken, poolData, identityPoolId, "us-east-2");
			tokens.accessKeyId = credentials.accessKeyId;
			tokens.secretAccessKey = credentials.secretAccessKey;
			tokens.sessionToken = credentials.sessionToken;
			console.log("AWS Credentials retrieved:", tokens);
		} catch (error) {
			console.error("Error retrieving AWS credentials:", error);
		}

		res.json(tokens);
	} catch (error) {
		console.error("Error during login:", error);
		res.status(500).json({ message: "Login failed", error: error.message || error.toString() });
	}
});

/** 🔹 Fetch S3 Resources */
app.post("/api/resource", async (req, res) => {
	const region = "us-east-2";
	const { accessKeyId, secretAccessKey, sessionToken, bucketName } = req.body;

	if (!accessKeyId || !secretAccessKey || !sessionToken) {
		return res.status(400).json({ message: "Missing AWS credentials." });
	}

	const profile = { region, credentials: { accessKeyId, secretAccessKey, sessionToken }, bucketName };
	console.log(`Fetching S3 resources for profile...`);

	try {
		const resourceData = await getS3Resources(profile);
		res.json(resourceData);
	} catch (error) {
		console.error("Error fetching S3 resources:", error);
		res.status(500).json({ message: "Error fetching resources", error: error.message });
	}
});

/** 🔹 Delete S3 Resource */
app.post("/api/resource/delete", async (req, res) => {
	const region = "us-east-2";
	const { accessKeyId, secretAccessKey, sessionToken, bucketName } = req.body;

	if (!accessKeyId || !secretAccessKey || !sessionToken) {
		return res.status(400).json({ message: "Missing AWS credentials." });
	}

	const profile = { region, credentials: { accessKeyId, secretAccessKey, sessionToken }, bucketName };
	console.log("Deleting resource...");

	try {
		const resourceData = await getS3Resources(profile); // Should be a delete function instead
		res.json(resourceData);
	} catch (error) {
		console.error("Error deleting resource:", error);
		res.status(500).json({ message: "Error deleting resource", error: error.message });
	}
});

/** 🔹 Add S3 Resource */
app.post("/api/resource/add", async (req, res) => {
	try {
		console.log("Entering API Call");

		const region = "us-east-2";
		const { accessKeyId, secretAccessKey, sessionToken, bucketName, filePath } = req.body;

		if (!accessKeyId || !secretAccessKey || !sessionToken || !filePath) {
			return res.status(400).json({ success: false, message: "Missing required fields." });
		}

		const credentials = { accessKeyId, secretAccessKey, sessionToken };
		const profile = { region, credentials, bucketName };

		const path = require("path");
		const fileName = path.basename(filePath);
		const ext = path.extname(filePath);
		const contentType = ext === ".jpg" ? "image/jpeg" : ext === ".png" ? "image/png" : "text/plain";

		let fileContent;
		try {
			fileContent = readFileSync(filePath);
		} catch (error) {
			console.error("Error reading file:", error);
			return res.status(500).json({ success: false, message: "Error reading file: " + error.message });
		}

		console.log("Uploading to S3...");
		const addData = await addS3Resource(profile, bucketName, fileName, fileContent, contentType);
		res.json(addData);
	} catch (error) {
		console.error("Error in /api/resource/add:", error);
		res.status(500).json({ success: false, message: "Server error: " + error.message });
	}
});

/** 🔹 List S3 Buckets */
app.post("/api/buckets_list", async (req, res) => {
	const region = "us-east-2";
	const { accessKeyId, secretAccessKey, sessionToken } = req.body;

	if (!accessKeyId || !secretAccessKey || !sessionToken) {
		return res.status(400).json({ error: "Missing AWS credentials" });
	}

	const s3 = new AWS.S3({ accessKeyId, secretAccessKey, sessionToken, region });

	try {
		console.log("Fetching S3 bucket list...");
		const bucketsResponse = await s3.listBuckets().promise();

		const bucketDetails = await Promise.all(
			bucketsResponse.Buckets.map(async (bucket) => {
				try {
					const objects = await s3.listObjectsV2({ Bucket: bucket.Name }).promise();
					return { name: bucket.Name, creationDate: bucket.CreationDate, objectCount: objects.KeyCount || 0 };
				} catch (error) {
					console.error(`Error listing objects for ${bucket.Name}:`, error);
					return { name: bucket.Name, creationDate: bucket.CreationDate, objectCount: "Unknown" };
				}
			})
		);

		console.log("Successfully fetched bucket list.");
		res.json({ buckets: bucketDetails });
	} catch (error) {
		console.error("Error fetching buckets:", error);
		res.status(500).json({ error: "Failed to fetch buckets" });
	}
});

/** Start the Server */
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});