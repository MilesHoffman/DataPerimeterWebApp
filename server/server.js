// server/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import the Cognito functions and static credential values using the correct relative path
const {
  authenticateUser,
  refreshSession,
  poolData,
  IDENTITY_POOL_ID,
} = require("./apis/cognito_api");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so that your React application can access this API
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// API endpoint for login
app.post("/api/login", async (req, res) => {
  const { username, password, idToggle } = req.body;
  console.log("Received login request:", { username, idToggle });

  // If the toggle is off, return an error response immediately
  if (!idToggle) {
    console.log("ID Toggle is OFF. Static credentials will not be provided.");
    return res.status(401).json({
      message:
        "Login failed: static credentials not provided because ID Toggle is off.",
    });
  }

  try {
    // Authenticate the user using Cognito
    const tokens = await authenticateUser(username, password);
    console.log("Cognito authentication successful:", tokens);

    // Since the toggle is on, attach the static credentials.
    tokens.userPoolId = poolData.UserPoolId;
    tokens.clientId = poolData.ClientId;
    tokens.identityPoolId = IDENTITY_POOL_ID;
    console.log("ID Toggle is ON. Attaching static credentials:", {
      userPoolId: poolData.UserPoolId,
      clientId: poolData.ClientId,
      identityPoolId: IDENTITY_POOL_ID,
    });

    console.log("Sending tokens back to client:", tokens);
    res.json(tokens);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message || error.toString(),
    });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
