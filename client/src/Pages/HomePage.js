import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

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
  const [accounts, setAccounts] = useState([
    { name: 'Dog LLC', resources: [
      { name: 'Happy Dogs', type: 'S3 Bucket', files: 3, status: 'compliant' },
      { name: 'Dog EC2', type: 'EC2 Instance', files: 0, status: 'compliant' }
    ]},
    { name: 'Competitor LLC', resources: [
      { name: 'Stolen Pics', type: 'S3 Bucket', files: 3, status: 'non-compliant' },
      { name: 'Competitor EC2', type: 'EC2 Instance', files: 0, status: 'non-compliant' }
    ]},
    { name: 'Puppy LLC', resources: [
      { name: 'Little Puppies', type: 'S3 Bucket', files: 5, status: 'compliant' },
      { name: 'Puppy EC2', type: 'EC2 Instance', files: 0, status: 'compliant' }
    ]}
  ]);

  const addNewAccount = (newAccount) => {
    setAccounts(prevAccounts => [newAccount, ...prevAccounts]);
  };

  const countStatuses = (accounts) => {
    let compliant = 0;
    let nonCompliant = 0;

    accounts.forEach(account => {
      account.resources.forEach(resource => {
        if (resource.status === 'compliant') {
          compliant++;
        } else if (resource.status === 'non-compliant') {
          nonCompliant++;
        }
      });
    });

    return { compliant, nonCompliant };
  };

  const { compliant, nonCompliant } = countStatuses(accounts);

  useEffect(() => {
    // replace the fetchAccountStatuses function with a real API call
    const fetchAccountStatuses = async () => {
      // Simulating an API response
      const updatedAccounts = [
        { name: 'Dog LLC', resources: [
          { name: 'Happy Dogs', type: 'S3 Bucket', files: 3, status: 'compliant' },
          { name: 'Dog EC2', type: 'EC2 Instance', files: 0, status: 'compliant' }
        ]},
        { name: 'Competitor LLC', resources: [
          { name: 'Stolen Pics', type: 'S3 Bucket', files: 3, status: 'non-compliant' },
          { name: 'Competitor EC2', type: 'EC2 Instance', files: 0, status: 'non-compliant' }
        ]},
        { name: 'Puppy LLC', resources: [
          { name: 'Little Puppies', type: 'S3 Bucket', files: 5, status: 'compliant' },
          { name: 'Puppy EC2', type: 'EC2 Instance', files: 0, status: 'compliant' }
        ]}
      ];

      // Update account statuses dynamically
      setAccounts(updatedAccounts);
    };

    fetchAccountStatuses();
  }, []);

  const handleCardClick = (resource) => {
    navigate('/resourcePage', { state: { resource } });
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
          <Typography variant="h6">{account.name}</Typography>
          <Grid container spacing={2}>
            {account.resources.map((resource, rIndex) => (
              <Grid item xs={12} sm={6} key={rIndex}>
                <DashboardCard status={resource.status} onClick={() => handleCardClick(resource.name)}>
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