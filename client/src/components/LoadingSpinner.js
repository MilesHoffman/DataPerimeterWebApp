import {CircularProgress} from "@mui/material";


export function LoadingSpinner(){

	return(
		<CircularProgress
			size={72}
			variant={'indeterminate'}
			sx={{
				color: '#ff9900',
				position: 'absolute',
				top: '50%',
				left: '50%',
				marginTop: '-12px',
				marginLeft: '-12px',
			}}
		/>
	)
}