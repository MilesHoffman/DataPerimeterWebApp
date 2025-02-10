import {ControlCamera, Rectangle, RectangleRounded} from "@mui/icons-material";
import {Button, Grid2, Paper, Typography, useTheme} from "@mui/material";
import {useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import ProfileContext from "../logic/profileLogic";



const tempHandler = (setAttachment = true) => {

	return setAttachment
}

const ControlWidget = ({
	title = 'title',
	editorHandler = () => {},
	policyType = 'SERVICE_CONTROL_POLICY'
}) => {

	const colors = useTheme().palette
	const [active, setActive] = useState(false)
	const policyName = title.replace(/ /g, '_');
	const {currentProfile} = useContext(ProfileContext)

	const attachmentHandler = async () => {

		if(!currentProfile){
			//TODO put a snack here
			console.log('Error, no profile')
			return
		}

		const attachString = active ? 'detach' : 'attach'
		const response = await axios.post(`http://localhost:5000/api/perimeter/${attachString}`, {
			accessKeyId: currentProfile.accessKeyId,
			secretAccessKey: currentProfile.secretAccessKey,
			sessionToken: currentProfile.sessionToken,
			policyName: policyName,
			policyType: policyType
		})
		const success = response.data.success

		//todo put a snack when the user doesn't have perimission

		setActive(success ? !active : active)
	}

	useEffect(() => {
		const check = async () => {

			if(!currentProfile){
				//todo put snack here
				console.log('Error, no profile')
				return
			}

			const response = await axios.post('http://localhost:5000/api/perimeter/check',{
				accessKeyId: currentProfile.accessKeyId,
				secretAccessKey: currentProfile.secretAccessKey,
				sessionToken: currentProfile.sessionToken,
				policyName: policyName,
				policyType: policyType
			})

			setActive(response.data.attached)
			if(response.data.error){
				console.log('Error...There was an unhandled error in policies.js for checking the policy')
				// TODO Put a snack here
			}
		}

		check()
	}, []);

	return (
		<div>
			<Paper
				sx={{
					background: colors.primary.light,
					padding: 1,
					width: 500,
					justifyContent: 'center',
					flexDirection: 'column'
				}}
				variant={'outlined'}
				elevation={2}
			>

				<Typography textAlign={'center'} variant={'h4'}>
					{title}
				</Typography>

				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						gap: 15,
					}}
				>
					<Button
						sx={{
							background: active? '#00C032' : 'red'
						}}
						onClick={attachmentHandler}
					>
						{active? 'ON': 'OFF'}
					</Button>

					<Button
						sx={{
							background: colors.secondary.main
						}}
						color={'primary'}
						onClick={editorHandler}
					>
						Edit Policy
					</Button>
				</div>


			</Paper>
		</div>
	)
}



export default function PolicyPage() {

	const navigate = useNavigate()


	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				paddingTop: 30,
				columnGap: 15,
				rowGap: 30,
				flexWrap: 'wrap',
			}}
		>
			<ControlWidget
				title={'Network Perimeter 1'}
				editorHandler={() => navigate('/networkControlOne')}
				policyType={'SERVICE_CONTROL_POLICY'}
			/>
			<ControlWidget
				title={'Network Perimeter 2'}
				editorHandler={()=>navigate('/networkControlTwo')}
				policyType={'RESOURCE_CONTROL_POLICY'}
			/>
			<ControlWidget
				title={'Identity Perimeter 1'}
				policyType={'SERVICE_CONTROL_POLICY'}
			/>
			<ControlWidget
				title={'Identity Perimeter 2'}
			/>
			<ControlWidget
				title={'Resource Perimeter 1'}
				policyType={'RESOURCE_CONTROL_POLICY'}
			/>
			<ControlWidget
				title={'Resource Perimeter 2'}
			/>
		</div>
	)
}

