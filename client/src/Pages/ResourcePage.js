import {useContext, useEffect, useState} from "react"
import axios from "axios"
import {useLocation } from "react-router-dom"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardContent from "@mui/material/CardContent"
import CardMedia from "@mui/material/CardMedia"
import Typography from "@mui/material/Typography"
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField} from "@mui/material"
import ProfileContext from "../logic/profileLogic"
import {LoadingSpinner} from "../components/LoadingSpinner";
import RefreshIcon from '@mui/icons-material/Refresh';
import {SnackAlert} from "../components/SnackAlert";
import SendIcon from '@mui/icons-material/Send';
import {flushSync} from "react-dom";

function ResourcePage() {
    const location = useLocation()
    const { state } = location
    const bucketName = state?.bucketName
    const [anchorEl, setAnchorEl] = useState(null)
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const openMenu = Boolean(anchorEl)
    const { currentProfile, profiles } = useContext(ProfileContext)
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState('success')
    const [selectedResource, setSelectedResource] = useState(null)
    const [openAddDialog, setOpenAddDialog] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [filePath, setFilePath] = useState("")

    // Handles closing snack
    const handleClose = (event, reason) => {
        if(reason === 'clickaway'){
            return
        }
        setOpen(false)
    }

    // Handles opening snack
    const handleSnackOpen = (message, severity) => {
        setMessage(message)
        setSeverity(severity)
        setOpen(true)
    }

    const handleClick = (event, resource) => {
        setAnchorEl(event.currentTarget)
        setSelectedResource(resource)
    };

    const handleAnchorElClose = () => {
        setAnchorEl(null)
    };

    const handleAddDialogClose = () => {
        setOpenAddDialog(false);
        setSelectedFile(null);
        setFilePath("")
    }

    const handleAddDialogOpen = () => {
        setOpenAddDialog(true)
    }

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0])
    }


    const handleAdd = async () => {

        if (!selectedFile) {
            handleSnackOpen("Please select a file.", "warning")
            return
        }

        setLoading(true)
        setError(null)

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('accessKeyId', currentProfile.accessKeyId);
        formData.append('secretAccessKey', currentProfile.secretAccessKey);
        formData.append('sessionToken', currentProfile.sessionToken);
        formData.append('bucketName', bucketName);
        formData.append('filePath', selectedFile.name);

        try {
            const result = await axios.post("http://localhost:5000/api/resource/add", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if(result.data){
                handleSnackOpen('Successfully added', 'success');
            }
            else{
                handleSnackOpen('Failed to add', 'error');
            }
            loadPage()

        } catch (err) {
            setError(err)
            handleSnackOpen('Failed to add: ' + (err.response?.data?.message || err.message), 'error');
            console.error("Error adding resource:", err);

        } finally {
            setLoading(false);
            handleAddDialogClose();
        }
    }

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`deleting resource ${selectedResource.name}`)

            const response = await axios.post("http://localhost:5000/api/resource/delete", {
                accessKeyId: currentProfile.accessKeyId,
                secretAccessKey: currentProfile.secretAccessKey,
                sessionToken: currentProfile.sessionToken,
                bucketName: bucketName,
                objectKey: selectedResource.name,
            })

            //setResources(response.data.resources || []) redundant?
            handleSnackOpen('Successfully deleted', 'success')
        } catch (err) {
            setError(err)
            handleSnackOpen('Failed to delete', 'error')
            console.error("Error Removing resource:", err)
        } finally {
            setLoading(false)
            handleAnchorElClose()
            loadPage()
        }
    }

    const fetchResources = async (bucketName) => {
        setLoading(true)
        setError(null)
        //test
        console.log("BucketName:",bucketName)
        console.log("AK:",currentProfile.accessKeyId)
        console.log("SAK:",currentProfile.secretAccessKey)
        console.log("ST:",currentProfile.sessionToken)
        try {
            const response = await axios.post("http://localhost:5000/api/resource", {
                accessKeyId: currentProfile.accessKeyId,
                secretAccessKey: currentProfile.secretAccessKey,
                sessionToken: currentProfile.sessionToken,
                bucketName: bucketName,
            })
            setResources(response.data.resources || [])
        } catch (err) {
            setError(err)
            console.error("Error fetching resources:", err)
        } finally {
            setLoading(false)
        }
    };

    const sendResource = async () => {
        try{
            console.log("Client sending resource: ", selectedResource.name)
            const sendBucket = prompt('Enter the name of the bucket you are sending to: ')

            setLoading(true)

            const res = await axios.post('http://localhost:5000/api/resources/send', {
                accessKeyId: currentProfile.accessKeyId,
                secretAccessKey: currentProfile.secretAccessKey,
                sessionToken: currentProfile.sessionToken,
                sourceBucketName: bucketName,
                destinationBucketName: sendBucket,
                objectName: selectedResource.name,
                objectType: selectedResource.type
            })
            const success = res.data.success

            if(success){
                handleSnackOpen('Successfully sent the file', 'success')
            }
            else{
                handleSnackOpen('Failed to send the file', 'error')
            }
        }
        catch (error){
            console.log('Error in sendResource: ', error)
            handleSnackOpen('Error: Failed to send the file', 'error')
        }
        finally {
            setLoading(false)
            handleAnchorElClose()
        }
    }

    const loadPage = () => {
        if (bucketName) {
            fetchResources(bucketName);
        } else {
            console.error("Bucket name is missing.");
        }
    }

    useEffect(() => {
        loadPage()
        console.log("profiles is: ", profiles)
    }, [bucketName, currentProfile]); //bucketName added

    if (loading) {
        return(
            <LoadingSpinner />
        )
    }

    if (error) {
        return <div>Error: {error.message}</div>
    }

    // If Current profile and bucket owner profile see 0 files
    if(
        resources.length === 0
        &&
        currentProfile?.resources?.find((bucket) => bucketName === bucket.name)?.files === 0
    ){
        return (
            <>
                <Stack direction="row" alignItems="center" spacing={3} marginBottom={'24px'} marginTop={'12px'} >
                    <Typography variant={'h4'}>{bucketName}</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDialogOpen}>
                        Add File
                    </Button>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadPage}>
                        Refresh
                    </Button>
                </Stack>
                <Typography color={'textPrimary'} variant={'h5'}>
                    No files found in the resource
                </Typography>
            </>
        )
    }

    // If Current profile sees 0 and bucket owner profile see > 0 files
    if(
        resources.length === 0
        &&
        profiles?.some(profile => profile?.resources?.some(bucket => bucket.name === bucketName && bucket.files > 0))
    ){
        return (
            <>
                <Stack direction="row" alignItems="center" spacing={3} marginBottom={'24px'} marginTop={'12px'} >
                    <Typography variant={'h4'}>{bucketName}</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDialogOpen}>
                        Add File
                    </Button>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadPage}>
                        Refresh
                    </Button>
                </Stack>
                <Typography color={'error'} variant={'h5'}>
                    Access Denied
                </Typography>
            </>
        )
    }

    return (
        <div style={{
            marginTop: '12px',
            paddingLeft: '12px',
            paddingRight: '12px'
        }}>
            <Stack direction="row" alignItems="center" spacing={3} marginBottom={'24px'} marginTop={'12px'} >
                <Typography variant={'h4'}>{bucketName}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDialogOpen}>
                    Add File
                </Button>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadPage}>
                    Refresh
                </Button>
            </Stack>

            <Grid container spacing={2}>
                {resources.map((resource, index) => (

                    <Grid item xs={12} sm={6} md={3} lg={3} key={index}>
                        <Card sx={{ height: 350, display: "flex", flexDirection: "column" }}>
                            <CardActionArea sx={{ flex: 1, display: "flex" }}>
                                {resource.type === "image" && resource.src ? (
                                    <>


                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={resource.src}
                                            alt={resource.name}
                                            sx={{ objectFit: "contain" }}
                                        />
                                    </>
                                ) : (
                                    <CardContent
                                        sx={{
                                            textAlign: "center",
                                            flex: 1,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <InsertDriveFileIcon sx={{ fontSize: 80 }} />
                                    </CardContent>
                                )}
                            </CardActionArea>
                            <CardContent
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <Typography gutterBottom variant="h5" component="div">
                                        {resource.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resource.type}
                                    </Typography>
                                </div>
                                <IconButton
                                    aria-label="more"
                                    id="long-button"
                                    aria-controls={openMenu? "long-menu": undefined}
                                    aria-expanded={openMenu? "true": undefined}
                                    aria-haspopup="true"
                                    onClick={(event) => handleClick(event, resource)}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    id="long-menu"
                                    MenuListProps={{
                                        "aria-labelledby": "long-button",
                                    }}
                                    anchorEl={anchorEl}
                                    open={openMenu}
                                    onClose={handleAnchorElClose}
                                >
                                    <MenuItem
                                        onClick={() => sendResource(resource.name, resource.type)}
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                    >
                                        Send
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => handleDelete(resource.name)}
                                        variant="contained"
                                        startIcon={<DeleteIcon />}
                                    >
                                        Delete
                                    </MenuItem>
                                </Menu>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openAddDialog} onClose={handleAddDialogClose}>
                <DialogTitle>Add File</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Choose a file to upload:
                    </DialogContentText>
                    <input
                        type="file"
                        accept="*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="raised-button-file"
                    />
                    <label htmlFor="raised-button-file">
                        <Button variant="contained" component="span" startIcon={<AddIcon />}>
                            Choose File
                        </Button>
                    </label>
                    {selectedFile && <Typography style={{marginTop: '8px'}}>{selectedFile.name}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddDialogClose}>Cancel</Button>
                    <Button onClick={handleAdd} variant="contained">Upload</Button>
                </DialogActions>
            </Dialog>

            <SnackAlert handleClose={handleClose} open={open} message={message} severity={severity} />
        </div>
    );

}

export default ResourcePage;