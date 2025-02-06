import { useState } from 'react';
import {Autocomplete, Box, Button, Divider, Fab, TextField, Typography, useTheme} from '@mui/material';
import CastleIcon from '@mui/icons-material/Castle';
import {DynamicTextFieldList} from "../../components/DynamicTextFieldList";
import PublishIcon from '@mui/icons-material/Publish';


const initializeValues = () => {
	// this will eventually set all the values ater grabbing them from the API
}

export default function NetworkControlTwo() {

	const colors = useTheme().palette

	const [textSid, setTextSid] = useState('');
	const [hasChanged, setChanged] = useState(false);
	const [effect, setEffect] = useState('Deny')
	const [action, setAction] = useState('')
	const [resource, setResource] = useState('')
	const [ipAddresses, setIpAddresses] = useState([''])
	const [vpcIds, setVpcIds] = useState([''])


	const handleChangeSid = (event) => {
		setTextSid(event.target.value);
	};

	const MyDivider = () => {
		return(
			<div style={{width: '100%', maxWidth: 500, background: '#000000'}}>
				<Divider sx={{ thickness: 2}} color={'#000000'} flexItem />
			</div>
		)
	}

	return (
		<div
			style={{
				padding: 15,
				marginBottom: 100,
				rowGap: 30,
				minHeight: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexDirection: 'column',
				//background: '#489199'
			}}
		>
			<Typography variant={'h6'}>
				Modify your perimeter policy here
			</Typography>
			<CastleIcon sx={{width: 100, height: 100}} />

			<TextField
				sx={{
					width: 300
				}}
				label="Policy Name (Sid)"
				variant="outlined"
				value={textSid}
				onChange={handleChangeSid}
			/>

			<MyDivider />

			<Typography>
				Effect on your actions:
			</Typography>
			<Autocomplete
				options={['Deny','Allow']}
				sx={{ width: 300 }}
				renderInput={(params) => <TextField value={effect} {...params} label="Effect" />}
			/>

			<MyDivider />

			<Typography>
				Actions watched:
			</Typography>
			<Autocomplete
				options={['*']}
				sx={{ width: 300 }}
				renderInput={(params) => <TextField value={action} {...params} label="Set Action" />}
			/>

			<MyDivider />

			<Typography>
				Resources protected:
			</Typography>
			<Autocomplete
				options={['S3 Buckets', '*']}
				sx={{ width: 300 }}
				renderInput={(params) => <TextField value={resource} {...params} label="Set Resource" />}
			/>

			<MyDivider />

			<Typography>
				Allowed IP Addresses:
			</Typography>
			<DynamicTextFieldList setValues={setIpAddresses} values={ipAddresses} textBoxLabels={'IP Address'} />

			<MyDivider />

			<Typography>
				Allowed VPCs:
			</Typography>
			<DynamicTextFieldList setValues={setVpcIds} values={vpcIds} textBoxLabels={'VPC'} />

			<Fab
				variant="extended"
				color={'secondary'}
				disabled={hasChanged}
				sx={{
					position: 'fixed',
					bottom: 50,
					right: 50,
				}}
			>
				<PublishIcon sx={{ mr: 1 }} />
				Save Policy
			</Fab>
		</div>
	);
}