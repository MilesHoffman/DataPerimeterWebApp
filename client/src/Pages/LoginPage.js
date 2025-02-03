// LoginPage.js
import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import axios from "axios"; // Use Axios for API calls
import ProfileContext from "../logic/profileLogic"; // Adjust the import path as needed

function LoginPage() {
  const [toggleState, setToggleState] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Get the addProfile function from the profile context
  const { addProfile } = useContext(ProfileContext);

  const handleToggleChange = (event) => {
    setToggleState(event.target.checked);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      // Include idToggle in the POST data (make sure your backend is on port 5000)
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
        idToggle: toggleState,
      });

      const tokens = response.data;
      console.log("Authentication successful:", tokens);

      // Store tokens in localStorage as needed
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("idToken", tokens.idToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      // If the toggle is on, store the static credentials in localStorage
      // and add a new profile via the context.
      if (toggleState) {
        localStorage.setItem("userPoolId", tokens.userPoolId);
        localStorage.setItem("clientId", tokens.clientId);
        localStorage.setItem("identityPoolId", tokens.identityPoolId);

        // Create a profileData object with the username and keys
        const profileData = {
          name: username,
          resources: [], // You could call getResources() later or leave it empty
          keys: {
            userPoolId: tokens.userPoolId,
            clientId: tokens.clientId,
            identityPoolId: tokens.identityPoolId,
          },
        };

        // Call addProfile to store this profile in your global state
        addProfile(profileData);
      }

      alert("Login successful!");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="grey.100"
      p={2}
    >
      <Box textAlign="center" width={{ xs: "90%", sm: "80%", md: 400 }}>
        <Box display="flex" justifyContent="center" mb={3}>
          <img
            src="https://www.baylineins.com/wp-content/uploads/2016/09/erie-insurance-logo.png"
            alt="Erie Insurance Logo"
            style={{ height: "100px" }}
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          Data Perimeter Account Login
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Enter your credentials to sign in
        </Typography>
        <Box
          component="form"
          mt={2}
          display="flex"
          flexDirection="column"
          gap={2}
          onSubmit={handleLogin}
        >
          <TextField
            label="Enter Email / Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <FormControlLabel
            control={
              <Switch checked={toggleState} onChange={handleToggleChange} />
            }
            label="ID Toggle"
          />
          <Button variant="contained" color="primary" fullWidth type="submit">
            Sign in
          </Button>
        </Box>
        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" color="textSecondary">
          Logged accounts
        </Typography>
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
          <Button variant="outlined" fullWidth>
            Person 1
          </Button>
          <Button variant="outlined" fullWidth>
            Person 2
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginPage;
