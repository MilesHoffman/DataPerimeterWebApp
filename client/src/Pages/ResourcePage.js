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
    const [resources, setResources] = useState({});
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
                accessKeyId: 'ASIAVIOZFWO2OYNJWQY4',
                secretAccessKey:'b9lIbhD5sgjSuv8TOI4uBzjnuZVHCESN12V59uA6',
                sessionToken:'IQoJb3JpZ2luX2VjEDEaCXVzLWVhc3QtMiJIMEYCIQDMGJMIxLg4azjjCTllw5X2l3FeQivfzgmLBwBf7/OZ6wIhAOt39jPo2x6xtn7k95Ms9jOliu4VyaqQRxr9S9HUz0hvKsQECEoQABoMMzYxNzY5NTc5NDQ0IgyqWilNzrpn+xxvOW0qoQSeMTUBXNpQMJ9wKoKxxlWjvfutzqVQPLsy/ETqFAFc2FmzRTKIkcNJqTJLZWOLO+6xgwK/Z0Zol6JOyerHIOdoZWFLq6rU3EpY+b90tf8tyIoByeRig2FISoj4hGLa2odt74ZPNnLMnD05ofsdjGuPfFMURhmrqnCLW48zCbUGVwaBod5+xTA3bYxFhy/ZH9sHuyr9Eznr/M7DalL9elwRfMh+S/KTrBBM5hqUNumLqPr5Sa1jKUwlAU6a8NuKhoO/XtGRg1cW0Ykx/HKygYQF/0stqoQmvg7MR+xw7VWNCQM362hnmSBzV9kn5moQoC6/pDkAxPumqiElYc9InuA0C1tQvHpWa9Vm5uUh2M5mVCb+EZMp+S3pP9agMHiubA9JmviV7KVQtv9zNe+nA3xxpbW//CbaAXoYzOnvb4Cd8NRnULGT+T3TEJcUoOavMzU4qxITK4N1jUSK19gP/eEZtmDQhABnKh6QQfDIP8ntqangkXJib1wKKTho8utyVKY5btSnoLpA+P2CspqSy/rw6dwph0E6dpFiXQ2fCVYYwZzbSWuf4WojRmGcXTLHqvhh8zd/7bjWC6gbEBvw99wXkv+v2Tv0V9E4Uw0ljmSt/sE1YHoOOuR5V4MDOnqrU36zjDpUlvXRvNx61JxwrbK4EYrGDbIMPmHebwcBBjEoZaTmziwHND5v2+GtLA7iN2CJaapSaEVYXPt1/TwwYQYyQTDeto69BjqEAgRAWmh/hMP2oQ7ZwTEHl+NUJbcSXjw708xaylBPmxur34K312eFtSclMzW6KQL8PydtgkoGBe1Q63iB+9/UFUFCufOVUPAk9ogy57SbpaA7uJs03BwBBSlAGCEbO9e83wUyxxto8PFeSvLkoUSWEBZXjmNntzwjnUUCD8i/rlNF9vLdMNxSz3/j+AKJu9krII9ZmTg+50Ps33M7xGpTd3ED4BNEFXe8r95PjfKUKCf4O2EUKHZckUDl6g7bjxDm5whfHBAhkk7zu7dsMMT5MmJduIz3XIfT4i4X9UNivZSJRG7prB74WFAwBT45mGMDUzM8UuLv757Dm0zYHc7+NfsN9s/h',
                bucketName: "puppy-pics-s3",
            });

            setResources(response.data || {});
        } catch (err) {
            setError(err);
            console.error("Error fetching resources:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        //fetchResources();
        console.log('test')
        console.log('test2')
    },[]); // The empty dependency array ensures the effect runs only once

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
                {Object.values(resources).map((resource, index) => (
                    <Grid item xs={12} sm={6} md={3} lg={3} key={index}>
                        <Card
                            sx={{ height: 350, display: "flex", flexDirection: "column" }}
                        >
                            <CardActionArea sx={{ flex: 1, display: "flex" }}>
                                {resource.type === "image"? (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={resource.src}
                                        alt={resource.name}
                                        sx={{ objectFit: "contain" }}
                                    />
                                ): (
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