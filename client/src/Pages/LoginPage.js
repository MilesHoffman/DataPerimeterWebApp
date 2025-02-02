import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";

function LoginPage() {
  const [toggleState, setToggleState] = useState(false);

  const handleToggleChange = (event) => {
    setToggleState(event.target.checked);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="grey.100"
      p={2} // Ensures spacing is responsive
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
          Data Perimeter account add
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Enter in your info to get your account signed in
        </Typography>
        <Box
          component="form"
          mt={2}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label="Enter Email / Username"
            variant="outlined"
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
          />
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
