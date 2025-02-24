import {Alert, Snackbar} from "@mui/material";
import React from "react";


export function SnackAlert({open, handleClose, message, severity}){

	return(
		<Snackbar
			autoHideDuration={4000}
			open={open}
			onClose={handleClose}
			anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
		>
			<Alert variant={'filled'} severity={severity} onClose={handleClose}>
				{message}
			</Alert>
		</Snackbar>
	)
}