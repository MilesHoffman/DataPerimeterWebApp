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
import axios from "axios"; // Using Axios for API calls
import ProfileContext from "../logic/profileLogic";

function LoginPage() {
  // State variables for form inputs and errors
  const [toggleState, setToggleState] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Get the addProfile function from our profile context
  const { addProfile } = useContext(ProfileContext);

  // Update the toggle state when the switch is flipped
  const handleToggleChange = (event) => {
    setToggleState(event.target.checked);
  };

  // Handle the login form submission
  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      // Send POST request to our backend with username, password, and idToggle
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
        idToggle: toggleState,
      });

      const tokens = response.data;
      console.log("Authentication successful:", tokens);

      // Save tokens in localStorage for later use
      //localStorage.setItem("accessToken", tokens.accessToken);
      //localStorage.setItem("idToken", tokens.idToken);
      //localStorage.setItem("refreshToken", tokens.refreshToken);

      // If the toggle is on, also store the static credentials and add a new profile
      if (toggleState) {
        //localStorage.setItem("userPoolId", tokens.userPoolId);
        //localStorage.setItem("clientId", tokens.clientId);
        //localStorage.setItem("identityPoolId", tokens.identityPoolId);

        // Create a profile data object to add to the global state
        const profileData = {
          name: username,
          resources: [], // Resources can be fetched later or kept empty
          keys: {
            userPoolId: tokens.userPoolId,
            clientId: tokens.clientId,
            identityPoolId: tokens.identityPoolId,
          },
        };

        // Add the profile using our context function
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
        {/* Logo section */}
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
        {/* Login form */}
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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Display error message if there is one */}
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
          <Button variant="contained" color="primary"  type="submit">
            Sign in
          </Button>
        </Box>
        <Divider sx={{ my: 4 }} />
        {/* Section for logged accounts (dummy buttons for now) */}
        <Typography variant="body2" color="textSecondary">
          Logged accounts
        </Typography>
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
          <Button variant="outlined">
            Person 1
          </Button>
          <Button variant="outlined">
            Person 2
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginPage;
