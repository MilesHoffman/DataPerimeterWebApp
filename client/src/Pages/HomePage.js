import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Box, Typography, Grid, Paper, CircularProgress, Button } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import ProfileContext from "../logic/profileLogic";

const DashboardContainer = styled(Box)({
  padding: "20px",
  marginTop: "64px",
});

const StatusBadge = styled(Box)(({ status }) => ({
  backgroundColor: status === "compliant" ? "#90CAF9" : "#EF9A9A",
  color: "#000",
  padding: "10px 15px",
  borderRadius: "8px",
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: "15px",
  display: "inline-block",
}));

const DashboardCard = styled(Paper)(({ status }) => ({
  padding: "15px",
  backgroundColor: status === "compliant" ? "#BBDEFB" : "#FFCDD2",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px",
  cursor: "pointer",
  transition: "0.3s",
  "&:hover": {
    backgroundColor: status === "compliant" ? "#90CAF9" : "#EF9A9A",
  },
}));

const Homepage = () => {
  const navigate = useNavigate();
  const { profiles, currentProfile } = useContext(ProfileContext);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileCompliance, setProfileCompliance] = useState({});
  const fetchedProfiles = useRef(new Set());
  const fetchedCompliance = useRef(new Set());

  const fetchProfileData = async () => {
    if (!profiles || profiles.length === 0) {
      setAccounts([]);
      return;
    }

    fetchedProfiles.current.clear(); // Clear fetched profile tracking
    setLoading(true);
    setError(null);

    const updatedAccounts = [];

    for (const profile of profiles) {
      try {
        console.log(`Fetching S3 buckets for ${profile.name}...`);
        const bucketResponse = await axios.post("http://localhost:5000/api/buckets_list", {
          accessKeyId: profile.accessKeyId,
          secretAccessKey: profile.secretAccessKey,
          sessionToken: profile.sessionToken,
        });

        console.log(`S3 Buckets Response for ${profile.name}:`, bucketResponse.data);

        const bucketResources = bucketResponse.data.buckets?.map((bucket) => ({
          name: bucket.name,
          type: "S3 Bucket",
          files: bucket.objectCount,
        })) || [];

        updatedAccounts.push({ name: profile.name, profile, resources: bucketResources });
      } catch (err) {
        console.error(`Error fetching data for ${profile.name}:`, err);
        setError(`Failed to fetch data for ${profile.name}.`);
      }
    }

    setAccounts(updatedAccounts);
    setLoading(false);
  };

  const fetchComplianceStatus = async () => {
    if (!profiles || profiles.length === 0) return;

    fetchedCompliance.current.clear(); // Clear fetched compliance tracking
    const updatedCompliance = {};

    for (const profile of profiles) {
      try {
        console.log(`Fetching compliance for: ${profile.name}`);

        const response = await axios.post("http://localhost:5000/api/compliance_check", {
          accessKeyId: profile.accessKeyId,
          secretAccessKey: profile.secretAccessKey,
          sessionToken: profile.sessionToken,
        });

        console.log(`API Response for ${profile.name}:`, response.data);

        updatedCompliance[profile.name] = response.data.compliant ? "compliant" : "non-compliant";
      } catch (err) {
        console.error(`Error checking compliance for ${profile.name}:`, err);
        updatedCompliance[profile.name] = "error";
      }
    }

    setProfileCompliance(updatedCompliance);
  };

  useEffect(() => {
    fetchProfileData();
    fetchComplianceStatus();
  }, [profiles, currentProfile]);

  const handleProfileClick = (account) => {
    navigate("/resourcePage", { state: { account: account.profile } });
  };

  const handleRefresh = () => {
    fetchProfileData();
    fetchComplianceStatus();
  };

  const countStatuses = () => {
    let compliant = 0;
    let nonCompliant = 0;
    accounts.forEach((account) => {
      if (profileCompliance[account.name] === "compliant") {
        compliant++;
      } else if (profileCompliance[account.name] === "non-compliant") {
        nonCompliant++;
      }
    });
    return { compliant, nonCompliant };
  };

  const { compliant, nonCompliant } = countStatuses();

  return (
    <DashboardContainer>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Box display="flex" gap={2} marginBottom={2}>
        <StatusBadge status="compliant">{compliant} Profiles Compliant</StatusBadge>
        <StatusBadge status="non-compliant">{nonCompliant} Profiles Non-Compliant</StatusBadge>
      </Box>

      <Button variant="contained" color="primary" onClick={handleRefresh} sx={{ marginBottom: 2 }}>
        Refresh Dashboard
      </Button>

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : accounts.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          No profiles found.
        </Typography>
      ) : (
        accounts
          .sort((a, b) => (a.name === currentProfile?.name ? -1 : 1)) // Sort current profile to top
          .map((account, index) => (
            <Box key={index} sx={{ marginTop: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: account.name === currentProfile?.name ? "bold" : "normal" }}>
                {account.name} {profileCompliance[account.name] ? `(${profileCompliance[account.name]})` : ""}
              </Typography>
              <Grid container spacing={2}>
                {account.resources.map((resource, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <DashboardCard
                      status={profileCompliance[account.name]}
                      onClick={() => handleProfileClick(account)}
                    >
                      <Typography variant="h6">
                        {profileCompliance[account.name] === "compliant" ? "✔" : "✖"} {resource.name}
                      </Typography>
                      <Typography variant="body2">{resource.type}</Typography>
                      <Typography variant="body2">{resource.files} Files</Typography>
                    </DashboardCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
      )}
    </DashboardContainer>
  );
};

export default Homepage;