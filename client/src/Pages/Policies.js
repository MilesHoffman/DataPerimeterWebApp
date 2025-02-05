import {ControlCamera, Rectangle, RectangleRounded} from "@mui/icons-material";
import {Button, Grid2, Paper, Typography, useTheme} from "@mui/material";


const ControlWidget = ({title = 'title', active = true}) => {

	const colors = useTheme().palette

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

				<Typography textAlign={'center'}>
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
					>
						{active? 'ON': 'OFF'}
					</Button>

					<Button
						sx={{
							background: colors.primary.main
						}}
					>
						Edit Policy
					</Button>
				</div>


			</Paper>
		</div>
	)
}


export default function PolicyPage() {


	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				paddingTop: 30,
				gap: 15,
				flexWrap: 'wrap',
			}}
		>
			<ControlWidget/>
			<ControlWidget/>
			<ControlWidget/>
			<ControlWidget/>
			<ControlWidget/>
			<ControlWidget/>
		</div>
	)
}

