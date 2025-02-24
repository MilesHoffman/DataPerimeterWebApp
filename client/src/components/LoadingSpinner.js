import {CircularProgress} from "@mui/material";


export function LoadingSpinner(){

	return(
		<CircularProgress
			size={72}
			variant={'indeterminate'}
			sx={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				marginTop: '-12px',
				marginLeft: '-12px',
				background: '#232f3e',
				borderRadius: 90
			}}
			color={'secondary'}
		/>
	)
}