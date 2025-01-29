import React from "react";
import { Box, Button, TextField, Typography, Divider } from "@mui/material";

function LoginPage() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="grey.100"
    >
      <Box
        bgcolor="white"
        p={4}
        borderRadius={2}
        boxShadow={3}
        width="100%"
        maxWidth={400}
        textAlign="center"
      >
        <Box display="flex" justifyContent="center" mb={3}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvHNaZt_Y2iwZHS3DK7g7fqknWNPjCWvCGRQ&s"
            alt="Erie Insurance Logo"
            style={{ height: "50px" }}
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
