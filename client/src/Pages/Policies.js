import {ControlCamera, Rectangle, RectangleRounded} from "@mui/icons-material";
import {Button, Grid2, Paper, Typography, useTheme} from "@mui/material";
import {useState} from "react";
import {useNavigate} from "react-router-dom";



const tempHandler = (setAttachment = true) => {

	return setAttachment
}

const ControlWidget = ({title = 'title', editorHandler = () => {}}) => {

	const colors = useTheme().palette
	const [active, setActive] = useState(false)

	const attachmentHandler = () => {
		// Eventually this should make a REST call to the server to attach or detach the policy
		setActive(tempHandler(!active))
	}


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
			/>
			<ControlWidget
				title={'Network Perimeter 2'}
				editorHandler={()=>navigate('/networkControlTwo')}
			/>
			<ControlWidget title={'Identity Perimeter 1'}/>
			<ControlWidget title={'Identity Perimeter 2'}/>
			<ControlWidget title={'Resource Perimeter 1'}/>
			<ControlWidget title={'Resource Perimeter 2'}/>
		</div>
	)
}

