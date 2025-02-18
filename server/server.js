/**
 * Express server for handling user authentication with Cognito.
 * This file sets up the API endpoints for logging in and for managing resources and policies.
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import Cognito and resource functions
const { authenticateUser, getAWSCredentials } = require("./apis/cognito_api");
const { getS3Resources, addS3Resource } = require("./apis/resource_api");
const { readFileSync } = require("node:fs");

// Import policy functions
const { togglePolicy, isPolicyAttached } = require("./apis/scp_rcp_api");
const {
  createNetworkPerimeterSCP,
  deleteSCP,
  getNetworkPerimeter1Info,
} = require("./apis/scp_api");
const {
  createNetworkPerimeterRCP,
  getNetworkPerimeter2Info,
  deleteRCP,
} = require("./apis/rcp_api");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// --------------------- COMMON ENDPOINTS ---------------------

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password, identityPoolId, userPoolId, clientId } = req.body;
  console.log("Received login request:", { username });

  try {
    const tokens = await authenticateUser(username, password, clientId);
    console.log("Cognito authentication successful");

    tokens.userPoolId = userPoolId;
    const poolData = { UserPoolId: userPoolId, ClientId: clientId };

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

// Resource endpoints
app.post("/api/resource", async (req, res) => {
  const region = "us-east-2";
  const { accessKeyId, secretAccessKey, sessionToken, bucketName } = req.body;
  const credentials = { accessKeyId, secretAccessKey, sessionToken };
  const profile = { region, credentials, bucketName };
  console.log("Entering resource endpoint");
  const resourceData = await getS3Resources(profile);
  console.log("Exit resource endpoint");
  res.json(resourceData);
});

app.post("/api/resource/delete", async (req, res) => {
  const region = "us-east-2";
  const { accessKeyId, secretAccessKey, sessionToken, bucketName } = req.body;
  const credentials = { accessKeyId, secretAccessKey, sessionToken };
  const profile = { region, credentials, bucketName };
  console.log("Entering resource delete endpoint");
  const resourceData = await getS3Resources(profile);
  console.log("Exit resource delete endpoint");
  res.json(resourceData);
});

app.post("/api/resource/add", async (req, res) => {
  try {
    console.log("Entering resource add endpoint");
    const region = "us-east-2";
    const { accessKeyId, secretAccessKey, sessionToken, bucketName, filePath } =
      req.body;
    const credentials = { accessKeyId, secretAccessKey, sessionToken };
    const profile = { region, credentials, bucketName };

    if (!filePath) {
      return res
        .status(400)
        .json({ success: false, message: "File path is required." });
    }

    let fileInfo;
    try {
      const path = require("path");
      const fileNameWithExt = path.basename(filePath);
      const extName = path.extname(filePath);
      const fileName = path.basename(filePath, extName);
      const dirName = path.dirname(filePath);
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
      }
      const fileType = contentType.split("/")[0];
      fileInfo = {
        success: true,
        name: fileName,
        extension: extName,
        fullName: fileNameWithExt,
        directory: dirName,
        contentType,
        fileType,
      };
    } catch (parseError) {
      console.error("Error parsing file path:", parseError);
      return res
        .status(400)
        .json({
          success: false,
          message: "Error parsing file path: " + parseError.message,
        });
    }

    if (!fileInfo.success) {
      return res
        .status(400)
        .json({ success: false, message: fileInfo.message });
    }

    const { fullName, contentType, fileType } = fileInfo;
    console.log(fileType, contentType);
    let fileContent;
    if (fileType === "image") {
      try {
        fileContent = readFileSync(filePath);
      } catch (readError) {
        console.error("Error reading image file:", readError);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error reading image file: " + readError.message,
          });
      }
    } else if (fileType === "text") {
      try {
        fileContent = readFileSync(filePath, "utf-8");
      } catch (error) {
        console.error("Error reading text file:", error);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error reading the text file: " + error.message,
          });
      }
    } else {
      try {
        fileContent = readFileSync(filePath);
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Unsupported file type: ${fileType}`,
          });
      }
    }

    console.log("Entering addS3Resource function");
    const addData = await addS3Resource(
      profile,
      bucketName,
      fullName,
      fileContent,
      contentType
    );
    console.log("Exit addS3Resource function");
    res.json(addData);
  } catch (error) {
    console.error("Error in /api/resource/add:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
});

// --------------------- POLICY ENDPOINTS ---------------------

// Generic policy endpoints (attach, detach, check)
app.post("/api/perimeter/attach", async (req, res) => {
  try {
    const {
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType,
    } = req.body;
    const response = await togglePolicy(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType,
      true
    );
    res.json({ success: response });
  } catch (error) {
    console.log("Error in attach call:", error);
    res.json({ success: false });
  }
});

app.post("/api/perimeter/detach", async (req, res) => {
  try {
    const {
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType,
    } = req.body;
    const response = await togglePolicy(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType,
      false
    );
    res.json({ success: response });
  } catch (error) {
    console.log("Error in detach call:", error);
    res.json({ success: false });
  }
});

app.post("/api/perimeter/check", async (req, res) => {
  try {
    const {
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType,
    } = req.body;
    const response = await isPolicyAttached(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName,
      policyType
    );
    res.json({ attached: response, error: false });
  } catch (error) {
    console.log("Error in checking if policy is attached:", error);
    res.json({ attached: false, error: true });
  }
});

// ------------ SCP ----------------
// SCP Endpoints for Network Perimeter 1
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
    const deleteSuccess = await deleteSCP(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName
    );
    if (!deleteSuccess) {
      console.log(
        "SCP deletion failed (possibly did not exist). Proceeding with creation."
      );
    }
    const createSuccess = await createNetworkPerimeterSCP(
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
    res.json({ success: createSuccess });
  } catch (error) {
    console.error("Error in recreating network perimeter SCP:", error);
    res.json({ success: false });
  }
});

app.post("/api/perimeter/getNetwork1Info", async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, sessionToken, policyName } = req.body;
    const policyInfo = await getNetworkPerimeter1Info(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName
    );
    if (!policyInfo) {
      res.json({
        success: false,
        message: `Policy named ${policyName} not found.`,
      });
      return;
    }
    res.json({ success: true, ...policyInfo });
  } catch (error) {
    console.error("Error in getting network perimeter info:", error);
    res.json({ success: false, error: error.message });
  }
});
// ------------ SCP ----------------

// ------------ RCP ----------------
// RCP Endpoints for Network Perimeter 2
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
    const deleteSuccess = await deleteRCP(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName
    );
    if (!deleteSuccess) {
      console.log(
        "RCP deletion failed (possibly did not exist). Proceeding with creation."
      );
    }
    console.log(
      "Type of createNetworkPerimeterRCP:",
      typeof createNetworkPerimeterRCP
    );
    const createSuccess = await createNetworkPerimeterRCP(
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
    res.json({ success: createSuccess });
  } catch (error) {
    console.error("Error in modifying network perimeter RCP:", error);
    res.json({ success: false });
  }
});

app.post("/api/perimeter/getNetwork2Info", async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, sessionToken, policyName } = req.body;
    const policyInfo = await getNetworkPerimeter2Info(
      accessKeyId,
      secretAccessKey,
      sessionToken,
      policyName
    );
    if (!policyInfo) {
      res.json({
        success: false,
        message: `Policy named ${policyName} not found.`,
      });
      return;
    }
    res.json({ success: true, ...policyInfo });
  } catch (error) {
    console.error("Error in getting network perimeter RCP info:", error);
    res.json({ success: false, error: error.message });
  }
});
// ------------ RCP ----------------

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
