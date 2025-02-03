// server/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import the Cognito functions using the correct relative path
const { authenticateUser, refreshSession } = require("./apis/cognito_api");

const app = express();
const PORT = 5000;

// Enable CORS so that your React application can access this API
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// API endpoint for login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Authenticate the user using Cognito
    const tokens = await authenticateUser(username, password);
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
