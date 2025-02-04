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
  refreshSession,
  poolData,
  IDENTITY_POOL_ID,
} = require("./apis/cognito_api");
const {getS3Resources} = require("./apis/resource_api");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so our React app can call this API
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// API endpoint for login requests
app.post("/api/login", async (req, res) => {
  // Destructure username, password, and idToggle from the request body
  const { username, password, idToggle } = req.body;
  console.log("Received login request:", { username, idToggle });

  // If the idToggle is off, return an error immediately
  if (!idToggle) {
    console.log("ID Toggle is OFF. Static credentials will not be provided.");
    return res.status(401).json({
      message:
        "Login failed: static credentials not provided because ID Toggle is off.",
    });
  }

  try {
    // Authenticate the user with Cognito
    const tokens = await authenticateUser(username, password);
    console.log("Cognito authentication successful:", tokens);

    // Attach static credentials since the toggle is on
    tokens.userPoolId = poolData.UserPoolId;
    tokens.clientId = poolData.ClientId;
    tokens.identityPoolId = IDENTITY_POOL_ID;
    console.log("ID Toggle is ON. Attaching static credentials:", {
      userPoolId: poolData.UserPoolId,
      clientId: poolData.ClientId,
      identityPoolId: IDENTITY_POOL_ID,
    });

    // Send the tokens back to the client
    console.log("Sending tokens back to client:", tokens);
    res.json(tokens);
  } catch (error) {
    // Log and send back an error response if something goes wrong
    console.error("Error during login:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message || error.toString(),
    });
  }
});

//Resource API


app.post("/api/resource", async (req, res) => {

  const region= "us-east-2";
  const { accessKeyId, secretAccessKey, sessionToken, bucketName } = req.body;
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
  //console.log("Entering function")
  const resourceData = await getS3Resources(profile);
  //console.log("Exit function")

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


  res.json(resourceData);
})



// Start the Express server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


