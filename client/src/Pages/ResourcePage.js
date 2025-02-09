import {useContext, useEffect, useState} from "react"
import axios from "axios"
import { Link } from "react-router-dom"
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
import { Stack } from "@mui/material"
import ProfileContext from "../logic/profileLogic"

function ResourcePage() {
    const [anchorEl, setAnchorEl] = useState(null)
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const open = Boolean(anchorEl)
    const { currentProfile } = useContext(ProfileContext)
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    };

    const handleClose = () => {
        setAnchorEl(null)
    };


    const handleAdd = async () => {
        const filePath = prompt("Enter the full file path of the resource you want to add:")
        if (!filePath) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await axios.post("http://localhost:5000/api/resource/add", {
                accessKeyId: currentProfile.accessKeyId,
                secretAccessKey: currentProfile.secretAccessKey,
                sessionToken: currentProfile.sessionToken,
                bucketName: "puppy-pics-s3",
                filePath: filePath,
            })

            setResources(response.data.resources || [])
        } catch (err) {
            setError(err)
            console.error("Error adding resource:", err)
        } finally {
            setLoading(false)
        }
    }
    const fetchResources = async () => {
        setLoading(true)
        setError(null)
        //test

        console.log("AK:",currentProfile.accessKeyId)
        console.log("SAK:",currentProfile.secretAccessKey)
        console.log("ST:",currentProfile.sessionToken)
        try {
            const response = await axios.post("http://localhost:5000/api/resource", {
                accessKeyId: currentProfile.accessKeyId,
                secretAccessKey: currentProfile.secretAccessKey,
                sessionToken: currentProfile.sessionToken,
                bucketName: "puppy-pics-s3",
            })

            setResources(response.data.resources || [])
        } catch (err) {
            setError(err)
            console.error("Error fetching resources:", err)
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchResources()

        return () => {
            resources.forEach(resource => {
                if (resource.type === "image" && resource.data) {
                    const blob = new Blob([resource.data], { type: resource.contentType })
                    URL.revokeObjectURL(URL.createObjectURL(blob))
                }
            });
        };
    }, [])

    if (loading) {
        return <div>Loading resources...</div>
    }

    if (error) {
        return <div>Error: {error.message}</div>
    }

    return (
        <div>
            <Stack direction="row" alignItems="center" spacing={1}>
                <h1>Name of resource</h1>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                    Add
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
                                    aria-controls={open? "long-menu": undefined}
                                    aria-expanded={open? "true": undefined}
                                    aria-haspopup="true"
                                    onClick={handleClick}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    id="long-menu"
                                    MenuListProps={{
                                        "aria-labelledby": "long-button",
                                    }}
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                >
                                    <MenuItem
                                        onClick={handleClose}
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                    >
                                        Modify
                                    </MenuItem>
                                    <MenuItem
                                        onClick={handleClose}
                                        variant="contained"
                                        startIcon={<DeleteIcon />}
                                    >
                                        Delete
                                    </MenuItem>
                                    <MenuItem onClick={handleClose}>Option 3</MenuItem>
                                </Menu>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </div>
    );

}

export default ResourcePage;