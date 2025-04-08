import React, {useState, useEffect, useContext, useRef} from "react";
import axios from "axios";
import {Box, Typography, Grid, Paper, CircularProgress, Button} from "@mui/material";
import {styled} from "@mui/system";
import {useNavigate} from "react-router-dom";
import ProfileContext from "../logic/profileLogic";
import {LoadingSpinner} from "../components/LoadingSpinner";
import {flushSync} from "react-dom";

const DashboardContainer = styled(Box)({
	padding: "20px",
});

const StatusBadge = styled(Box)(({status}) => ({
	backgroundColor: status === "compliant" ? "#7CEABA" : "#EF9A9A",
	color: "#000",
	padding: "10px 15px",
	borderRadius: "8px",
	fontWeight: "bold",
	textAlign: "center",
	marginBottom: "15px",
	display: "inline-block",
}));

const DashboardCard = styled(Paper)(({status}) => ({
	padding: "15px",
	backgroundColor: status === "compliant" ? "#7CEABA" : "#FFCDD2",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: "5px",
	cursor: "pointer",
	transition: "0.3s",
	"&:hover": {
		backgroundColor: status === "compliant" ? "#20CA80" : "#EF9A9A",
	},
}));


const Homepage = () => {
	const navigate = useNavigate()
	const {profiles, currentProfile, setResources} = useContext(ProfileContext)
	const [accounts, setAccounts] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [profileCompliance, setProfileCompliance] = useState({})
	const fetchedProfiles = useRef(new Set())
	const fetchedCompliance = useRef(new Set())

	const fetchProfileData = async () => {
		if (!profiles || profiles.length === 0) {
			setAccounts([])
			return
		}

		fetchedProfiles.current.clear()
		setLoading(true)
		setError(null)

		const accountsPromises = profiles.map(async (profile) => {
			try {
				const bucketResponse = await axios.post("http://localhost:5000/api/buckets_list", {
					accessKeyId: profile.accessKeyId,
					secretAccessKey: profile.secretAccessKey,
					sessionToken: profile.sessionToken,
				})

				const bucketResources = bucketResponse.data.buckets?.map((bucket) => ({
					name: bucket.name,
					type: "S3 Bucket",
					files: bucket.objectCount,
				})) || []

				return { name: profile.name, profile, resources: bucketResources }

			} catch (err) {
				console.error(`Error fetching data for ${profile.name}:`, err)
				setError(`Failed to fetch data for ${profile.name}.`)
				return { name: profile.name, profile, resources: [] }
			}
		})

		try {
			const updatedAccounts = await Promise.all(accountsPromises)
			setAccounts(updatedAccounts)

			updatedAccounts.map((account) => {
				setResources(account.name, account.resources)
			})

			console.log("updated the accounts: ", updatedAccounts)
		} catch (err) {
			console.error("Error in Promise.all:", err)
		} finally {
			setLoading(false)
		}
	}

	


	const fetchComplianceStatus = async () => {
		if (!profiles || profiles.length === 0) return;

		fetchedCompliance.current.clear()
		let updatedCompliance = {};

		const compliancePromises = profiles.map(async (profile) => {
			try {

				const checkingProfile = accounts.find((account) => account.name === profile.name);

				let checkingBucketName = '';
				if (checkingProfile.resources !== undefined && checkingProfile.resources.length > 0) {
					checkingBucketName = checkingProfile.resources[0].name;
				} else {
					return { profileName: profile.name, status: "no-resources" };
				}

				const response = await axios.post("http://localhost:5000/api/compliance_check", {
					accessKeyId: currentProfile.accessKeyId,
					secretAccessKey: currentProfile.secretAccessKey,
					sessionToken: currentProfile.sessionToken,
					bucketName: checkingBucketName
				})

				const profileCompliance = response.data

				console.log(`compliance for ${checkingProfile.name} is: `, profileCompliance)

				return { profileName: profile.name, status: profileCompliance ? "compliant" : "non-compliant" }

			} catch (err) {
				console.error(`Error checking compliance for ${profile.name}:`, err)
				return { profileName: profile.name, status: "error" }
			}
		})

		setLoading(true)

		const results = await Promise.allSettled(compliancePromises)

		results.forEach((result) => {
			if (result.status === 'fulfilled') {
				updatedCompliance[result.value.profileName] = result.value.status;
			} else {
				console.error("Promise rejected unexpectedly:", result.reason)
				updatedCompliance[result.value.profileName] = "error"
			}
		})

		setProfileCompliance(updatedCompliance)
		setLoading(false)
	};

	// Gets the profile's data
	useEffect(() => {
		const fetchData = async () => {
			await fetchProfileData();
			setLoading(false)
		};
		fetchData();

	}, [profiles, currentProfile]);

	// Gets compliance when accounts variable is set
	useEffect(() => {
		const complianceHandle = async () => {
			await fetchComplianceStatus()
			setLoading(false)
			console.log("All profile compliance: ", profileCompliance)
		}
		complianceHandle()
	}, [accounts]);

	const handleProfileClick = (account, bucketName) => {
		navigate("/resourcePage", {state: {account: account.profile, bucketName: bucketName}});
	};

	const handleRefresh = () => {
		fetchProfileData();

		console.log(profiles)
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
		return {compliant, nonCompliant};
		
	};
	const {compliant, nonCompliant} = countStatuses();

	return (
		<DashboardContainer>

			<Box display="flex" gap={2} marginBottom={2}>
				<StatusBadge status="compliant">{compliant} Profiles Compliant</StatusBadge>
				<StatusBadge status="non-compliant">{nonCompliant} Profiles Non-Compliant</StatusBadge>
			</Box>

			<Button variant="contained" color="primary" onClick={handleRefresh} sx={{marginBottom: 2}}>
				Refresh Dashboard
			</Button>

			{loading ? (
				<LoadingSpinner/>
			) : accounts.length === 0 ? (
				<Typography variant="body1" color="textSecondary">
					No profiles found.
				</Typography>
			) : (
				accounts
					.sort((a, b) => (a.name === currentProfile?.name ? -1 : 1)) // Sort current profile to top
					.map((account, index) => (
						<Box key={index} sx={{marginTop: 2}}>
							<Typography variant="h5"
							            sx={{fontWeight: account.name === currentProfile?.name ? "bold" : "normal"}}>
								{account.name}
							</Typography>
							<Grid container spacing={2}>
								{
									account.resources.length > 0 ?
										account.resources.map((resource, i) => (
											<Grid item xs={12} sm={6} md={4} key={i}>
												<DashboardCard
													status={profileCompliance[account.name]}
													onClick={() => handleProfileClick(account, resource.name)}
												>
													<Typography variant="h6">
														{profileCompliance[account.name] === "compliant" ? "✔" : "✖"} {resource.name}
													</Typography>
													<Typography variant="body2">{resource.type}</Typography>
													<Typography variant="body2">{resource.files} Files</Typography>
												</DashboardCard>
											</Grid>
										))
										:
										<Typography color={'red'} marginTop={'20px'} marginLeft={'40px'}>
											Unable to retrieve resource information.
										</Typography>
								}
							</Grid>
						</Box>
					))
			)}
		</DashboardContainer>
	);
};

export default Homepage;
