import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Dialog } from '@mui/material';
import { styled } from '@mui/system';

const PoliciesContainer = styled(Box)({
  padding: '20px',
  marginTop: '64px',
});

const PolicyCard = styled(Paper)({
  padding: '20px',
  backgroundColor: '#E0E0E0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px',
  flexDirection: 'column',
  textAlign: 'center',
  gap: '10px',
});

const PolicyEditor = styled(Paper)({
  padding: '20px',
  backgroundColor: '#F5F5F5',
  height: '300px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const Policies = () => {
  const [policies, setPolicies] = useState({
    "Identity Perimeter 1": true,
    "Identity Perimeter 2": true,
    "Resource Perimeter 1": true,
    "Resource Perimeter 2": true,
    "Network Perimeter 1": true,
    "Network Perimeter 2": true,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const togglePolicy = (policy) => {
    setPolicies((prevPolicies) => ({
      ...prevPolicies,
      [policy]: !prevPolicies[policy],
    }));
  };

  const openEditor = (policy) => {
    setSelectedPolicy(policy);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setSelectedPolicy(null);
  };

  return (
    <PoliciesContainer>
      <Typography variant="h5" gutterBottom>
        Policy Controls
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(policies).map(([key, value]) => (
          <Grid item xs={12} sm={6} key={key}>
            <PolicyCard>
              <Typography variant="h6">{key}</Typography>
              <Button variant="contained" color={value ? 'success' : 'error'} onClick={() => togglePolicy(key)}>
                {value ? 'ON' : 'OFF'}
              </Button>
              <Button variant="outlined" onClick={() => openEditor(key)}>Edit Policy</Button>
            </PolicyCard>
          </Grid>
        ))}
      </Grid>
      <Dialog open={editorOpen} onClose={closeEditor} maxWidth="sm">
        <Box p={3}>
          <Typography variant="h6">Editing {selectedPolicy}</Typography>
          <PolicyEditor>
            <Typography variant="body1">Policy Editor for {selectedPolicy}</Typography>
          </PolicyEditor>
          <Box mt={2} textAlign="right">
            <Button variant="contained" onClick={closeEditor}>Close</Button>
          </Box>
        </Box>
      </Dialog>
    </PoliciesContainer>
  );
};

export default Policies;