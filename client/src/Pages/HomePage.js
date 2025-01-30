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
  const { profiles, setCurrentProfile, currentProfileId } = useContext(ProfileContext);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const updatedAccounts = Object.values(profiles)
      .map(profile => ({
        name: profile.name,
        resources: profile.resources || [],
        lastActive: profile.lastActive || 0,
      }))
      .sort((a, b) => (b.name === currentProfileId ? 1 : -1)); // Ensure selected profile stays on top
    
    setAccounts(updatedAccounts);
  }, [profiles, currentProfileId]);

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

  const handleAccountClick = (accountName) => {
    setCurrentProfile(accountName);
  };

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
          <Typography variant="h6" onClick={() => handleAccountClick(account.name)} style={{ cursor: 'pointer', fontWeight: account.name === currentProfileId ? 'bold' : 'normal' }}>
            {account.name}
          </Typography>
          <Grid container spacing={2}>
            {account.resources.map((resource, rIndex) => (
              <Grid item xs={12} sm={6} key={rIndex}>
                <DashboardCard status={resource.status}>
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
