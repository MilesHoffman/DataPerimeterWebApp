import React, { useState, useContext } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProfileContext from "../logic/profileLogic";

const CLITerminalPage = () => {
	const navigate = useNavigate();
	const { currentProfile } = useContext(ProfileContext);
	const [cliCommand, setCliCommand] = useState("");
	const [cliOutput, setCliOutput] = useState("");

	const handleRunCliCommand = async () => {
		if (!cliCommand || !currentProfile) return;
		try {
			setCliOutput("Running command...");
			const response = await axios.post("http://localhost:5000/api/cli", {
				accessKeyId: currentProfile.accessKeyId,
				secretAccessKey: currentProfile.secretAccessKey,
				sessionToken: currentProfile.sessionToken,
				command: cliCommand,
			});
			setCliOutput(response.data.output || "No output.");
		} catch (error) {
			console.error("Error running CLI command:", error);
			setCliOutput(`Error: ${error.response?.data?.error || error.message}`);
		}
	};

	// Show friendly message if no profile is logged in
	if (!currentProfile) {
		return (
			<Box p={4}>
				<Typography variant="h4" mb={2}>
					AWS CLI Terminal
				</Typography>
				<Typography variant="body1" mb={3}>
					You must be logged in to use the terminal.
				</Typography>
				<Button variant="contained" onClick={() => navigate("/login")}>
					Go to Login
				</Button>
			</Box>
		);
	}

	// Terminal page for logged-in users
	return (
		<Box p={4}>
			<Typography variant="h4" mb={3}>
				AWS CLI Terminal
			</Typography>

			<Typography variant="subtitle1" mb={1}>
				Logged in as: <strong>{currentProfile.name}</strong>
			</Typography>

			<Box display="flex" gap={2} alignItems="center" mb={2}>
				<input
					type="text"
					value={cliCommand}
					onChange={(e) => setCliCommand(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleRunCliCommand();
						}
					}}
					placeholder="e.g. ec2 describe-instances"
					style={{
						flex: 1,
						padding: "10px",
						borderRadius: "5px",
						border: "1px solid #ccc",
						fontFamily: "monospace",
					}}
				/>
				<Button variant="contained" color="secondary" onClick={handleRunCliCommand}>
					Run
				</Button>
			</Box>

			<Box
				p={2}
				sx={{
					backgroundColor: "#000",
					color: "#0f0",
					minHeight: "300px",
					borderRadius: "8px",
					overflow: "auto",
					whiteSpace: "pre-wrap",
					fontFamily: "monospace",
				}}
			>
				<pre>{cliOutput || "Enter a command to begin..."}</pre>
			</Box>
		</Box>
	);
};

export default CLITerminalPage;
