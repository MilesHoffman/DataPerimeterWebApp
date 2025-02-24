import {useState, useEffect, useContext} from 'react'
import {Autocomplete, Box, Button, Divider, Fab, Snackbar, TextField, Typography, useTheme} from '@mui/material'
import CastleIcon from '@mui/icons-material/Castle'
import {DynamicTextFieldList} from "../../components/DynamicTextFieldList"
import PublishIcon from '@mui/icons-material/Publish'
import axios from 'axios'
import ProfileContext from "../../logic/profileLogic";
import {LoadingSpinner} from "../../components/LoadingSpinner";
import {SnackAlert} from "../../components/SnackAlert";

export default function NetworkControlOne() {

	const colors = useTheme().palette

	const [policyName, setPolicyName] = useState('')
	const [textSid, setTextSid] = useState('')
	const [hasChanged, setChanged] = useState(false)
	const [effect, setEffect] = useState('Deny')
	const [action, setAction] = useState([''])
	const [resources, setResources] = useState([''])
	const [sourceIps, setSourceIps] = useState([''])
	const [sourceVpcs, setSourceVpcs] = useState([''])
	const {currentProfile} = useContext(ProfileContext)
	const [open, setOpen] = useState(false)
	const [message, setMessage] = useState('')
	const [severity, setSeverity] = useState('')
	const [loading, setLoading] = useState(false)

	// starts the snack alert
	const handleSnackOpen = (message, severity) => {
		setMessage(message)
		setSeverity(severity)
		setOpen(true)
	}

	// closes the snack
	const handleClose = () => {
		setOpen(false)
	}

	const fetchData = async () => {
		try {
			setLoading(true)

			const accessKeyId = currentProfile.accessKeyId
			const secretAccessKey = currentProfile.secretAccessKey
			const sessionToken = currentProfile.sessionToken
			const policyName = "Network_Perimeter_1"

			const response = await axios.post('/api/perimeter/getNetwork1Info', {
				accessKeyId,
				secretAccessKey,
				sessionToken,
				policyName,
			})

			if (response.data.success) {
				const data = response.data
				setPolicyName(data.policyName)
				setTextSid(data.sid)
				setEffect(data.effect)
				setAction(data.action)
				setResources(data.resources)
				setSourceIps(data.sourceIps)
				setSourceVpcs(data.sourceVpcs)
				setChanged(false)

			} else {
				console.error("Failed to fetch policy data:", response.data.message)
				handleSnackOpen('Failed to load policy info', 'error')
			}
		} catch (error) {
			handleSnackOpen('Failed to load policy info', 'error')
			console.error("Error fetching policy data:", error)
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handleChangeSid = (event) => {
		setTextSid(event.target.value)
		setChanged(true)
	}

	const handleEffectChange = (event, newValue) => {
		setEffect(newValue)
		setChanged(true)
	}

	const handleActionChange = (event, newValue) => {
		setAction(newValue)
		setChanged(true)
	}
	const handleResourceChange = (event, newValue) => {
		setResources(newValue)
		setChanged(true)
	}

	const handleSavePolicy = async () => {
		try {
			setLoading(true)
			const accessKeyId = currentProfile.accessKeyId
			const secretAccessKey = currentProfile.secretAccessKey
			const sessionToken = currentProfile.sessionToken

			const response = await axios.post('/api/perimeter/modifyNetwork1', {
				accessKeyId,
				secretAccessKey,
				sessionToken,
				policyName,
				effect,
				action,
				resources,
				sourceIps,
				sourceVpcs,
			})

			console.log(response.data)

			if (response.data.success) {
				console.log("Policy updated successfully")
				setChanged(false)
				handleSnackOpen('Successfully modified policy', 'success')
			} else {
				handleSnackOpen('Failed to modified policy', 'error')
				console.error("Failed to update policy")
			}
		} catch (error) {
			handleSnackOpen('Failed to modified policy', 'error')
			console.error("Error updating policy:", error)
		}
		finally {
			setLoading(false)
		}
	}

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
				value={effect}
				onChange={handleEffectChange}
				options={['Deny']}
				sx={{ width: 300 }}
				renderInput={(params) => <TextField  {...params} label="Effect" />}
			/>

			<MyDivider />

			<Typography>
				Actions watched:
			</Typography>
			<Autocomplete
				multiple
				value={action}
				onChange={handleActionChange}
				options={['*']}
				sx={{ width: 300 }}
				renderInput={(params) => <TextField  {...params} label="Set Action" />}
			/>

			<MyDivider />

			<Typography>
				Resources protected:
			</Typography>
			<Autocomplete
				multiple //for multiple select
				value={resources}
				onChange={handleResourceChange}
				options={['*']}
				sx={{ width: 300 }}
				renderInput={(params) => <TextField  {...params} label="Set Resource" />}
			/>

			<MyDivider />

			<Typography>
				Allowed IP Addresses:
			</Typography>
			<DynamicTextFieldList setValues={setSourceIps} values={sourceIps} textBoxLabels={'IP Address'} />

			<MyDivider />

			<Typography>
				Allowed VPCs:
			</Typography>
			<DynamicTextFieldList setValues={setSourceVpcs} values={sourceVpcs} textBoxLabels={'VPC'} />

			<Fab
				variant="extended"
				color={'secondary'}
				onClick={handleSavePolicy}
				sx={{
					position: 'fixed',
					bottom: 50,
					right: 50,
				}}
			>
				<PublishIcon sx={{ mr: 1 }} />
				Save Policy
			</Fab>

			{
				loading && (
					<LoadingSpinner />
				)
			}
			<SnackAlert open={open} severity={severity} handleClose={handleClose} message={message} />
		</div>
	)
}