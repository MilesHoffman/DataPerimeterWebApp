import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import ProfileContext from "../logic/profileLogic";

const DashboardContainer = styled(Box)({
  padding: '20px',
  marginTop: '64px', 
});

const StatusBadge = styled(Box)(({ status }) => ({
  backgroundColor: status === 'compliant' ? '#90CAF9' : '#EF9A9A',
  color: '#000',
  padding: '10px 15px',
  borderRadius: '8px',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '15px',
  display: 'inline-block',
}));

const DashboardCard = styled(Paper)(({ status }) => ({
  padding: '15px',
  backgroundColor: status === 'compliant' ? '#BBDEFB' : '#FFCDD2',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer',
  transition: '0.3s',
  '&:hover': {
    backgroundColor: status === 'compliant' ? '#90CAF9' : '#EF9A9A',
  },
}));

const Homepage = () => {
  const navigate = useNavigate();
  const { profiles, currentProfile } = useContext(ProfileContext);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (!currentProfile) {
      setAccounts([]);
      return;
    }

    // Ensure selected profile is at the top and add default resources if missing
    const updatedAccounts = profiles.map(profile => ({
      name: profile.name,
      resources: profile.resources.length > 0 ? profile.resources : [
        { name: "Default S3", type: "S3 Bucket", files: 10, status: "compliant" },
        { name: "Default EC2", type: "EC2 Instance", files: 5, status: "non-compliant" }
      ],
    })).sort((a, b) => (b.name === currentProfile?.name ? 1 : -1));
    
    setAccounts(updatedAccounts);
  }, [profiles, currentProfile]);

  const countStatuses = (accounts) => {
    let compliant = 0;
    let nonCompliant = 0;
    accounts.forEach(account => {
      account.resources.forEach(resource => {
        if (resource.status === 'compliant') {
          compliant++;
        } else {
          nonCompliant++;
        }
      });
    });
    return { compliant, nonCompliant };
  };

  const { compliant, nonCompliant } = countStatuses(accounts);

  const handleResourceClick = (resource) => {
    navigate('/resourcePage', { state: { resource } });
  };

  if (!currentProfile) {
    return (
      <DashboardContainer>
        <Typography variant="h4">Dashboard</Typography>
        <Typography variant="body1" color="textSecondary">
          No accounts are logged in.
        </Typography>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box display="flex" gap={2}>
        <StatusBadge status="compliant">{compliant} Resources Compliant</StatusBadge>
        <StatusBadge status="non-compliant">{nonCompliant} Resources Non-Compliant</StatusBadge>
      </Box>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        And more general widgets...
      </Typography>
      {accounts.map((account, index) => (
        <Box key={index} sx={{ marginTop: 2 }}>
          <Typography variant="h6" style={{ fontWeight: account.name === currentProfile.name ? 'bold' : 'normal' }}>
            {account.name}
          </Typography>
          <Grid container spacing={2}>
            {account.resources.map((resource, rIndex) => (
              <Grid item xs={12} sm={6} key={rIndex}>
                <DashboardCard status={resource.status} onClick={() => handleResourceClick(resource)}>
                  <Typography variant="h6">{resource.status === 'compliant' ? '✔' : '✖'} {resource.name}</Typography>
                  <Typography variant="body2">{resource.type} • {resource.files} Files</Typography>
                </DashboardCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </DashboardContainer>
  );
};

export default Homepage;
