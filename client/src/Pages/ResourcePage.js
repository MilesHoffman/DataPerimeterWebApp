import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Stack } from "@mui/material";

function ResourcePage() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const fetchResources = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post("http://localhost:5000/api/resource", {
                accessKeyId: 'ASIAVIOZFWO2PWLF3MQJ',
                secretAccessKey: 'BxaHE2OKUUV1LzLigq4nYCdOTa7gAb6ccwcnRR8/',
                sessionToken: 'IQoJb3JpZ2luX2VjEDYaCXVzLWVhc3QtMiJGMEQCIFRZgw6aBxjlT85Sa9ZQ62xCZr/SAiSOmoUcCDxlpNcQAiB7eZ5FTV+8nBR/BEIAlWlmsWUBFGErv9xLQd+AeL7MPSrEBAhQEAAaDDM2MTc2OTU3OTQ0NCIMMUlOz1F966jRmvZaKqEE6Xo5OSSx2UP4shu1rVbpnzbSMIHbb6Ds1p4lnQ4J6Uw0OegGXF0uWC6eLPTefhJCTWHWmQdY0ByjAyEccUqfQ7P4YsxcxY3zkXyCbE4VLVPOCVorpth2whEWKJd1xTo4vwJXFDDiP9XQJiLJjXXHpT+gLjbPcmFw3pbykJtG/EY3psKfo87Ole6+O1eKGpUJbKJUEIlHQnWdiMk5Et0KnDU8Oo9vr7RxcbVB7JcdsENMPzkO/lG9nxB7SrnknMvCQcTo0MAJnaVCAEVw5sz0YT55SOaekfruHJTTRXVqBMldatm3JFRCgVxq1QxBcWdGcKyBTJBKHeyts/DpfRP1vOROPeLhQjkYbleqddLKPKO8FhwL5MavXq0f/dLCD5oYwYEBzj/wyJttYT6jm18G94II9VaUIx/Lg1Ik2lXnhvEcQKNVAS7XtwB+j0cysgMf0EGz5E5sd3eD4dsCQOsLTOS3dZzrF7fYyNAmlhMYKgaiT4d18lNUwt+80g4ih+ePMXrccYHPjCGhEDIL/6Bn9PF58r0b/d8TNCd7B9hmUM7CNm30lOC8eumG/a0kaG1i53gKe+DIcnKbQJJe3gVm/lFAvCF5uV8MF6WLDFdmXZ0ahadpb6n/TeTEJN2+6xGSMGP/+PFriXw1UwOb628dSGVE7Zul9nTkaa2YqmSejPY2N0SQAqbef6S0FLtoySXDcwjs+DN67GwtYqOxh9VBWoowj8qPvQY6hgJaeeDQeKAuCFaUUwVptl8hEgofeuJ6iS7jZFwkyR4TE2o+qfyqhP3U3HrAF0U6I1nR0wIT6AYqXV55BjhAeXs0j/85L0scIEDwlE5M+Xrr+1t1idpBNgCFDOvwdcYITCZ5V82S4Um4q97EXkzMpCGKLFfrCwB/eA3wu5AYunRIwXSA/Ocb7p/h8MGeY16qpDOUkVriXz5cRy/Hkf3Wv1lpRRC0RsPGBrfDI2tQqhyjxTBK+BJ43iBBW5iirQ/qAJxSCeWWEGbroMA5QNcLpk6Lnb9ua/FIJOXYKvGjWByI9ptr9y3NBMbbreCN0AqoEiY1r8z2aUh4QkAqdhW4lXlzsU6DXhUt',

                bucketName: "puppy-pics-s3",
            });

            setResources(response.data.resources || []);
        } catch (err) {
            setError(err);
            console.error("Error fetching resources:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();

        return () => {
            resources.forEach(resource => {
                if (resource.type === "image" && resource.data) {
                    const blob = new Blob([resource.data], { type: resource.contentType })
                    URL.revokeObjectURL(URL.createObjectURL(blob));
                }
            });
        };
    }, []);

    if (loading) {
        return <div>Loading resources...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <Stack direction="row" alignItems="center" spacing={1}>
                <h1>Resource Page</h1>
                <IconButton
                    onClick={fetchResources}
                    variant="contained"
                    aria-label="add"
                >
                    <AddIcon />
                </IconButton>
            </Stack>

            <Grid container spacing={2}>
                {resources.map((resource, index) => (

                    <Grid item xs={12} sm={6} md={3} lg={3} key={index}>
                        <Card sx={{ height: 350, display: "flex", flexDirection: "column" }}>
                            <CardActionArea sx={{ flex: 1, display: "flex" }}>
                                {resource.type === "image" && resource.src ? (
                                    <>

                                        {console.log("resource.src:", resource.src)}
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