/**
 * Express server for handling user authentication with Cognito.
 * This file sets up the API endpoint for logging in and attaches static credentials
 * if a specific toggle is on. It uses Express, CORS, and Body Parser.
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import Cognito functions and static credentials from the proper file
const {
	authenticateUser,
	getAWSCredentials,
} = require("./apis/cognito_api");
const {getS3Resources,addS3Resource} = require("./apis/resource_api");
const {readFileSync} = require("node:fs");
const {togglePolicy, isPolicyAttached} = require("./apis/scp_rcp_api");
const {createNetworkPerimeterSCP, deleteSCP, getNetworkPerimeter1Info} = require("./apis/scp_api");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so our React app can call this API
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// API endpoint for login requests
app.post("/api/login", async (req, res) => {
	// Destructure username, password, and idToggle from the request body
	const {username, password, identityPoolId, userPoolId, clientId} = req.body;
	console.log("Received login request:", {username});

	try {
		// Authenticate the user with Cognito
		const tokens = await authenticateUser(username, password, clientId);
		console.log("Cognito authentication successful");

		// Attach credentials
		tokens.userPoolId = userPoolId;
		const poolData = {
			UserPoolId: userPoolId,
			ClientId: clientId
		};

		// Getting the other keys for API calls
		try {
			const credentials = await getAWSCredentials(tokens.idToken, poolData, identityPoolId, 'us-east-2')
			tokens.accessKeyId = credentials.accessKeyId
			tokens.secretAccessKey = credentials.secretAccessKey
			tokens.sessionToken = credentials.sessionToken
			console.log("AWS Credentials retrieved")
		} catch (error) {
			console.error("Error retrieving AWS credentials:", error)
		}

		// Send the tokens back to the client
		console.log("Sending tokens back to client")
		res.json(tokens)
	} catch (error) {
		// Log and send back an error response if something goes wrong
		console.error("Error during login:", error)
		res.status(500).json({
			message: "Login failed",
			error: error.message || error.toString(),
		})
	}
});

//Resource API


app.post("/api/resource", async (req, res) => {

	const region = "us-east-2"
	const {accessKeyId, secretAccessKey, sessionToken, bucketName} = req.body
	const credentials = {
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey,
		sessionToken: sessionToken,
	}

	const profile = {
		region: region,
		credentials: credentials,
		bucketName: bucketName
	}
	console.log("Entering function")
	const resourceData = await getS3Resources(profile)
	console.log("Exit function")

	/*
	try {


		const resourcesResult = await getS3Resources(profile);
		if (resourcesResult.success) {
			console.log("Resources Data:", JSON.stringify(resourcesResult.resources, null, 2));
		} else {
			console.error("Error:", resourcesResult.message);
		}

	} catch (error) {
		console.error("Main function error:", error);
	}

	console.log("res");
	*/
	res.json(resourceData);
})

app.post("/api/resource/delete", async (req, res) => {

	const region = "us-east-2"
	const {accessKeyId, secretAccessKey, sessionToken, bucketName} = req.body
	const credentials = {
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey,
		sessionToken: sessionToken,
	}

	const profile = {
		region: region,
		credentials: credentials,
		bucketName: bucketName
	}
	console.log("Entering function")
	const resourceData = await getS3Resources(profile)
	console.log("Exit function")


	res.json(resourceData)
})



app.post("/api/resource/add", async (req, res) => {
	try {
		console.log('Entering API Call')

		const region = "us-east-2"
		const {accessKeyId, secretAccessKey, sessionToken, bucketName,filePath} = req.body;
		const credentials = {
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
			sessionToken: sessionToken,
		}
		const profile = {
			region: region,
			credentials: credentials,
			bucketName: bucketName
		}


		if (!filePath) {
			return res.status(400).json({ success: false, message: "File path is required." })
		}

		let fileInfo;
		try {
			const path = require('path');

			const fileNameWithExt = path.basename(filePath)
			const extName = path.extname(filePath)
			const fileName = path.basename(filePath, extName)
			const dirName = path.dirname(filePath)

			let contentType = '';
			switch (extName.toLowerCase()) {
				case '.jpg':
				case '.jpeg':
					contentType = 'image/jpeg'
					break;
				case '.png':
					contentType = 'image/png'
					break;
				case '.txt':
					contentType = 'text/plain'
					break;

			}
			const fileType = contentType.split('/')[0]

			fileInfo = {
				success: true,
				name: fileName,
				extension: extName,
				fullName: fileNameWithExt,
				directory: dirName,
				contentType: contentType,
				fileType: fileType,
			}

		} catch (parseError) {
			console.error("Error parsing file path:", parseError)
			return res.status(400).json({ success: false, message: "Error parsing file path: " + parseError.message })
		}


		if (!fileInfo.success) {
			return res.status(400).json({ success: false, message: fileInfo.message })
		}

		const { fullName, contentType, fileType } = fileInfo // Destructure for easier access
		console.log(fileType)
		console.log(contentType)
		let fileContent
		if (fileType === 'image') {
			try {
				fileContent = readFileSync(filePath);
			} catch (readError) {
				console.error("Error reading image file:", readError)
				return res.status(500).json({ success: false, message: "Error reading image file: " + readError.message })
			}
		} else if (fileType === 'text') { // Explicitly check for 'text'
			try {
				fileContent = readFileSync(filePath, 'utf-8')
			} catch (error) {
				console.error("Error reading text file:", error)
				return res.status(500).json({ success: false, message: "Error reading the text file: " + error.message })
			}
		} else {
			try {
				fileContent = readFileSync(filePath); // Read as binary data
			} catch(error){
				return res.status(400).json({ success: false, message: `Unsupported file type: ${fileType}` })
			}

		}


		console.log("Entering addS3Resource function")
		const addData = await addS3Resource(profile, bucketName, fullName, fileContent, contentType)
		console.log("Exit addS3Resource function")

		res.json(addData);

	} catch (error) {
		console.error("Error in /api/resource/add:", error);
		res.status(500).json({ success: false, message: "Server error: " + error.message })
	}

})


/**
 * Turns on the policy specified. Only the management account has the credentials for this.
 *
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @param policyType
 * @return success Returns a success boolean variable
 */
app.post("/api/perimeter/attach", async (req, res) => {

	try{
		const {accessKeyId, secretAccessKey, sessionToken, policyName, policyType} = req.body

		// Turns on the policy
		const response = await togglePolicy(
			accessKeyId, secretAccessKey, sessionToken, policyName, policyType, true)

		res.json({success: response})
	}
	catch (error){
		console.log('...Error in attach call: ', error)
		res.json({success: false})
	}
})

/**
 * Turns off the policy specified. Only the management account has the credentials for this.
 *
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @param policyType
 * @return success Returns a success boolean variable
 */
app.post("/api/perimeter/detach", async (req, res) => {

	try{
		const {accessKeyId, secretAccessKey, sessionToken, policyName, policyType} = req.body

		// Turns on the policy
		const response = await togglePolicy(
			accessKeyId, secretAccessKey, sessionToken, policyName, policyType, false)

		res.json({success: response})
	}
	catch (error){
		console.log('...Error in detach call: ', error)
		res.json({success: false})
	}
})


/**
 * Turns off the policy specified. Only the management account has the credentials for this.
 *
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @param policyType
 * @return success Returns a json with boolean variables
 */
app.post("/api/perimeter/check", async (req, res) => {

	try{
		const {accessKeyId, secretAccessKey, sessionToken, policyName, policyType} = req.body

		// Checks if the policy is attached
		const response = await isPolicyAttached(
			accessKeyId, secretAccessKey, sessionToken, policyName, policyType)

		res.json({attached: response, error: false})
	}
	catch (error){
		console.log('...Error in checking if policy is attached: ', error)
		res.json({attached: false, error: true})
	}
})

/**
 * Recreates a network perimeter SCP (deletes and then creates).
 *
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @param effect
 * @param action
 * @param resources
 * @param sourceIps
 * @param sourceVpcs
 * @return success Returns a json with boolean variables
 */
app.post("/api/perimeter/modifyNetwork1", async (req, res) => {
	try {
		const { accessKeyId, secretAccessKey, sessionToken, policyName,
			effect, action, resources, sourceIps, sourceVpcs
		} = req.body;

		// delete the existing policy if it exists
		const deleteSuccess = await deleteSCP(
			accessKeyId, secretAccessKey, sessionToken, policyName
		);

		// Even if deletion fails because the policy doesn't exist, proceed to create
		if (!deleteSuccess) {
			console.log(`...Policy deletion failed (possibly did not exist). Proceeding with creation.`);
		}

		// create the policy
		const createSuccess = await createNetworkPerimeterSCP(
			accessKeyId, secretAccessKey, sessionToken, policyName, effect, action, resources, sourceIps, sourceVpcs
		);

		res.json({ success: createSuccess });

	} catch (error) {
		console.error("Error in recreating network perimeter SCP:", error);
		res.json({ success: false });
	}
});


/**
 * Retrieves information about a network perimeter SCP.
 *
 * @param accessKeyId
 * @param secretAccessKey
 * @param sessionToken
 * @param policyName
 * @return {Promise<void>} Returns a JSON object containing the policy information or an error.
 */
app.post("/api/perimeter/getNetwork1Info", async (req, res) => {
	try {
		const { accessKeyId, secretAccessKey, sessionToken, policyName } = req.body

		const policyInfo = await getNetworkPerimeter1Info(accessKeyId, secretAccessKey, sessionToken, policyName)

		if (!policyInfo) {
			res.json({success: false, message: `Policy named ${policyName} not found.` })
			return
		}


		res.json({ success: true, ...policyInfo })

	} catch (error) {
		console.error("Error in getting network perimeter info:", error)
		res.json({ success: false, error: error.message })
	}
})


// Start the Express server on the specified port
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});


