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
                accessKeyId: 'ASIAVIOZFWO2IMD5JOHX',
                secretAccessKey: 'p7icc8nJF23UwvvM9YkF9HZLt88a3gz41Eq6oZfZ',
                sessionToken: 'IQoJb3JpZ2luX2VjEDUaCXVzLWVhc3QtMiJIMEYCIQDSk/KpVjgYrKG60gTBiHALDCGRH5+Juq4w5u/JWtObGQIhAPpzQpc4n3Y1YT137cUl7IAZRQOKlVN8dm858iciJ88OKsQECE8QABoMMzYxNzY5NTc5NDQ0Igwl4P31c2QnIicm1jQqoQREd+RKiHhS3lUU7+vKXycNyD63Jjlm+bgza56ZmiNkZ2ZiIVfTq81uofpgvHtp2KkrjX4YRY0W7mXeD20NiezLwZALTQ4iE2aHpGn96ZIuar7UtahgYkwne7sAiIJPA4hiA/NODZdvrhO1qEz8Z7XLlTjG2R8hLcCKk7NjeskWh6iBH1ojayKGeC0VfXm2C/y9Vl0NUwSq/2k549FIW1b2LPEyke62XFKTY7Ylwh94OEXC3atuPGpsvnODRC8FKqdeoNOZSplp06rp7EYyT/FhpvrX4jn8LiryNtDQvPmyCdPcmJiVMb7l/4qnSGDVqpewghXlRdVctNIXtxVs1dUwtlA7LrYZF3WOTSzs8C685cjiVOf5Y0J2iee9/e3Ec4FM37j3gELYZC0HYws4N+ZQyJDaPufXzrk2EwZcRzHMM7bfroACzBhfoZEktcFo2vsX0f1H0dtZaCoNTUQWKmd87IR1T/NG8YK1aJsuyTzJDEDt6bp3hn8BXbjOpOSlmFmIIES4IXK0h2ZOBGOPpuY4FWQKpZo3g9b2VOXG4K7sYjp0KYh7d8pyFcYnV09p22LOCTB7o+yoilqitapVYDKgp1FSWuIokSRZL54VVLF1D3nGBelVyhFQpF4pj3MswV6Swz92P+xKT4uPwzMu99TEIIyWUjTx59f7X4+DCERfZV+2VW3xUIMk0zveDhyWZyc6fSfixm8qIKgT8nCXDuy9GDDArY+9BjqEApd8gd6j2T/eoi1OreQdVYD+E5rPCLdSaLr4HaiLqgUxVMfE5HHg0LOTHZKnaSq7K/u3syTi47pFmqYgEQM0PgYLcbcsPuUHYjVkjxB7NcAao2k8Z9DlSLeucGnPqhHAvqZ7V21mLuy5c7tXFmMccZOFOGjzI0f07Lt+1mB8GUrDH23Kuq5V75DrtJsNNGq3yvEqKzEd3iqjsCL0GewFCCdV24DDc8tj4Hm4dLjaxNGPWLdV+aaDaT2K38x6ugSDjGbECrGW6bQPx4FcNixs7WiQWIl4gISHvlZH5jve60E8753FzD822aLUBgWzrQ2iV6NaVpiXTtgrfJp30j0gi6yKeuw5',

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
                if (resource.type === "image" && resource.src) {
                    URL.revokeObjectURL(resource.src);
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