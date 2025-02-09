const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");

// Import Cognito functions and static credentials from the proper file
const { authenticateUser, getAWSCredentials } = require("./apis/cognito_api");
const { getS3Resources } = require("./apis/resource_api");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Store Data Perimeter state dynamically
let dataPerimeterEnabled = true; // Change this dynamically as needed

// Enable CORS so our React app can call this API
app.use(cors());
app.use(bodyParser.json());

// ✅ Default route to prevent "Cannot GET /"
app.get("/", (req, res) => {
    res.send("Backend Server is Running! Available APIs: /api/login, /api/resource, /api/buckets_list, /api/data_perimeter");
});

// ✅ API endpoint for login requests
app.post("/api/login", async (req, res) => {
    const { username, password, identityPoolId, userPoolId, clientId } = req.body;
    console.log("Received login request:", { username });

    try {
        const tokens = await authenticateUser(username, password, clientId);
        console.log("Cognito authentication successful:", tokens);

        tokens.userPoolId = userPoolId;
        const poolData = { UserPoolId: userPoolId, ClientId: clientId };

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

// ✅ API endpoint to fetch S3 bucket resources
app.post("/api/resource", async (req, res) => {
    const region = "us-east-2";
    const { accessKeyId, secretAccessKey, sessionToken, bucketName } = req.body;

    if (!accessKeyId || !secretAccessKey || !sessionToken) {
        return res.status(400).json({ error: "Missing AWS credentials" });
    }

    const credentials = { accessKeyId, secretAccessKey, sessionToken };
    const profile = { region, credentials, bucketName };

    console.log("Fetching resources for bucket:", bucketName);

    try {
        const resourceData = await getS3Resources(profile);
        res.json(resourceData);
    } catch (error) {
        console.error("Error fetching resources:", error);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

// ✅ API endpoint to fetch S3 bucket list
app.post("/api/buckets_list", async (req, res) => {
    const region = "us-east-2";
    const { accessKeyId, secretAccessKey, sessionToken } = req.body;

    if (!accessKeyId || !secretAccessKey || !sessionToken) {
        return res.status(400).json({ error: "Missing AWS credentials" });
    }

    const s3 = new AWS.S3({ accessKeyId, secretAccessKey, sessionToken, region });

    try {
        console.log(`Fetching S3 bucket list for ${accessKeyId}...`);
        const bucketsResponse = await s3.listBuckets().promise();
        console.log('Response for listing s3 buckets: ', bucketsResponse)
        const bucketDetails = await Promise.all(
            bucketsResponse.Buckets.map(async (bucket) => {
                try {
                    const objects = await s3.listObjectsV2({ Bucket: bucket.Name }).promise();
                    return {
                        name: bucket.Name,
                        creationDate: bucket.CreationDate,
                        objectCount: objects.KeyCount || 0,
                    };
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

// ✅ Fetch Data Perimeter status
app.get("/api/data_perimeter", (req, res) => {
    console.log(`Data Perimeter Status: ${dataPerimeterEnabled}`);
    res.json({ enabled: dataPerimeterEnabled });
});

// ✅ Toggle Data Perimeter status manually (for testing)
app.post("/api/toggle_data_perimeter", (req, res) => {
    dataPerimeterEnabled = !dataPerimeterEnabled; // Toggle the state
    console.log(`Data Perimeter is now: ${dataPerimeterEnabled ? "ENABLED" : "DISABLED"}`);
    res.json({ success: true, enabled: dataPerimeterEnabled });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
