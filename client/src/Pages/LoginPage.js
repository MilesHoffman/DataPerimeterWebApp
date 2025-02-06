import React, {useState, useContext} from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	Autocomplete,
} from "@mui/material";
import axios from "axios"; // Using Axios for API calls
import ProfileContext from "../logic/profileLogic";



const presets = {
	puppy: {
		identityPoolId: 'us-east-2:b3a5d7ea-d40d-4e87-a126-a3a8f953c92c',
		clientId: '5ku6g318514rb9u6hmn1dgvuvt',
		userPoolId: 'us-east-2_Z4LAAO6F8'
	},
	dog: {
		identityPoolId: 'us-east-2:eba3ab2e-8314-47bf-a8b2-9dd2f7a0ecce',
		clientId: '6jfl27ldku8gi24ch3q67fmkkc',
		userPoolId: 'us-east-2_9cD9h80bH'
	},
	canine: {
		identityPoolId: 'us-east-2:6d959f68-b088-47d2-8eef-a452fa6a314a',
		clientId: '1n2d7p9cp163h2pij9tndiqueh',
		userPoolId: 'us-east-2_xiDtHQ1Wp'
	},
	competitor: {
		identityPoolId: 'us-east-2:874c7859-1107-4a47-b185-fe297539de35',
		clientId: '1aosk6rgk4f7g4gnkjlpcu0vju',
		userPoolId: 'us-east-2_CPlwiQsFU'
	},
}

const presetParser = (preset) => {

	switch (preset){
		case 'Canine LLC':
			return presets.canine;
		case 'Dog LLC':
			return presets.dog;
		case 'Puppy LLC':
			return presets.puppy;
		case 'Competitor LLC':
			return presets.competitor;
		default:
			return null
	}
}

function LoginPage() {
	// State variables for form inputs and errors
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);
	const [identityPoolId, setIdPool] = useState('')
	const [userPoolId, setUserPoolId] = useState('')
	const [clientId, setClientId] = useState('')
	const [presetChange, setPresetChange] = useState('')

	// Get the addProfile function from our profile context
	const {addProfile} = useContext(ProfileContext);

	const handleUserPoolChange = (event) => {
		setUserPoolId(event.target.value);
	}

	const handleIdPoolChange = (event) => {
		setIdPool(event.target.value)
	}

	const handleClientChange = (event) => {
		setClientId(event.target.value)
	}

	const handlePresetChange = (event, newValue) => {
		let presetValues = presetParser(newValue)
		setClientId(presetValues.clientId)
		setUserPoolId(presetValues.userPoolId)
		setIdPool(presetValues.identityPoolId)
		setPresetChange(newValue)
	}

	// Handle the login form submission
	const handleLogin = async (event) => {
		event.preventDefault();
		setError(null);

		try {
			// Send POST request to our backend
			console.log('clientId: ', clientId)

			const response = await axios.post("http://localhost:5000/api/login", {
				username,
				password,
				clientId,
				userPoolId,
				identityPoolId
			});

			const tokens = response.data;
			console.log("Authentication successful:", tokens);

			// Create a profile data object to add to the global state
			const profileData = {
				name: username,
				resources: [], // Resources can be fetched later or kept empty
				keys: {
					userPoolId: tokens.userPoolId,
					clientId: tokens.clientId,
					identityPoolId: tokens.identityPoolId,
					accessKeyId: tokens.accessKeyId,
					secretAccessKey: tokens.secretAccessKey,
					sessionToken: tokens.sessionToken
				},
			};

			// Add the profile using our context function
			addProfile(profileData);

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
			<Box textAlign="center" width={{xs: "90%", sm: "80%", md: 400}}>
				{/* Logo section */}
				<Box display="flex" justifyContent="center" mb={3}>
					<img
						src="https://www.baylineins.com/wp-content/uploads/2016/09/erie-insurance-logo.png"
						alt="Erie Insurance Logo"
						style={{height: "100px"}}
					/>
				</Box>
				<Typography variant="h6" gutterBottom>
					Data Perimeter Account Login
				</Typography>
				<Typography variant="body2" color="textPrimary" gutterBottom>
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
					<TextField
						onChange={handleUserPoolChange}
						value={userPoolId}
						label={'Set User Pool ID'}
					/>
					<TextField
						onChange={handleClientChange}
						value={clientId}
						label={'Set Client ID'}
					/>
					<TextField
						onChange={handleIdPoolChange}
						value={identityPoolId}
						label={'Set Identity Pool ID'}
					/>
					<Autocomplete
						onChange={handlePresetChange}
						value={presetChange}
						options={['Canine LLC', 'Dog LLC', 'Puppy LLC', 'Competitor LLC']}
						renderInput={(params) => <TextField {...params} label="Set Identity ID" />}
					/>

					<Button variant="contained" color="primary" type="submit">
						Sign in
					</Button>
				</Box>

			</Box>
		</Box>
	);
}

export default LoginPage;
