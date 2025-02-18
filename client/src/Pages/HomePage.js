import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
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
  const [dataPerimeterEnabled, setDataPerimeterEnabled] = useState(false); // ✅ State for data perimeter

  useEffect(() => {
    if (!profiles || profiles.length === 0) {
      setAccounts([]);
      return;
    }

    const fetchDataPerimeterStatus = async () => {
      try {
        console.log("Fetching Data Perimeter status...");
        const response = await axios.get("http://localhost:5000/api/data_perimeter");
        console.log("Data Perimeter Status:", response.data);
        setDataPerimeterEnabled(response.data.enabled); // ✅ Set state from API
      } catch (err) {
        console.error("Error fetching Data Perimeter status:", err);
      }
    };

    fetchDataPerimeterStatus(); // ✅ Fetch data perimeter first
  }, [profiles]); // ✅ Only fetch when profiles change

  useEffect(() => {
    if (!profiles || profiles.length === 0) {
      setAccounts([]);
      return;
    }

    const fetchAllResources = async () => {
      setLoading(true);
      setError(null);
      let allResources = [];

      await Promise.all(profiles.map(async (profile) => {
        try {
          console.log(`Fetching S3 buckets for ${profile.name}...`);
          const response = await axios.post("http://localhost:5000/api/buckets_list", {
            accessKeyId: profile.accessKeyId,
            secretAccessKey: profile.secretAccessKey,
            sessionToken: profile.sessionToken,
          });

          console.log(`S3 Buckets Response for ${profile.name}:`, response.data);

          if (response.data.buckets) {
            const bucketResources = response.data.buckets.map((bucket) => ({
              name: bucket.name,
              type: "S3 Bucket",
              files: bucket.objectCount,

              // ✅ Apply Data Perimeter rule dynamically from API
              status: dataPerimeterEnabled && profile.name.includes("Competitor") ? "non-compliant" : "compliant",
            }));

            allResources.push({ name: profile.name, profile, resources: bucketResources });
          }
        } catch (err) {
          console.error(`Error fetching S3 buckets for ${profile.name}:`, err);
          setError(`Failed to fetch S3 buckets for ${profile.name}.`);
        }
      }));

      // ✅ Move currentProfile's account to the top
      if (currentProfile) {
        allResources.sort((a, b) => (a.name === currentProfile.name ? -1 : 1));
      }

      setAccounts(allResources);
      setLoading(false);
    };

    fetchAllResources(); // ✅ Fetch resources when dataPerimeterEnabled updates

  }, [profiles, currentProfile, dataPerimeterEnabled]); // ✅ Added `dataPerimeterEnabled` dependency

  const countStatuses = () => {
    let compliant = 0;
    let nonCompliant = 0;
    accounts.forEach((account) => {
      account.resources.forEach((resource) => {
        if (resource.status === "compliant") {
          compliant++;
        } else {
          nonCompliant++;
        }
      });
    });
    return { compliant, nonCompliant };
  };

  const { compliant, nonCompliant } = countStatuses();

  const handleResourceClick = (resource, account) => {
    navigate("/resourcePage", { state: { resource, account: account.profile } });
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
        AWS Resources Across All Accounts:
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : accounts.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          No resources found.
        </Typography>
      ) : (
        accounts.map((account, index) => (
          <Box key={index} sx={{ marginTop: 2 }}>
            <Typography variant="h6" style={{ fontWeight: account.name === currentProfile?.name ? "bold" : "normal" }}>
              {account.name}
            </Typography>
            <Grid container spacing={2}>
              {account.resources.map((resource, rIndex) => (
                <Grid item xs={12} sm={6} key={rIndex}>
                  <DashboardCard status={resource.status} onClick={() => handleResourceClick(resource, account)}>
                    <Typography variant="h6">
                      {resource.status === "compliant" ? "✔" : "✖"} {resource.name}
                    </Typography>
                    <Typography variant="body2">{resource.type} • {resource.files} Files</Typography>
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
