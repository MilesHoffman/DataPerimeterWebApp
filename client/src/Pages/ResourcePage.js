
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import testImage1 from '../tempResources/testImage1.jpg'
import testImage2 from '../tempResources/testImage2.jpg'
import testImage3 from '../tempResources/testImage3.jpg'
import testFile1 from '../tempResources/testFile.txt'
const resources = [
    {
        name: 'Document  1',
        type: 'document',
        src: testFile1,
    },
    {
        name: 'Image 1',
        type: 'image',
        src: testImage1,
    },
    {
        name: 'Image 2',
        type: 'image',
        src: testImage2,
    },
    {
        name: 'Image 3',
        type: 'image',
        src: testImage3,
    },
];
function ResourcePage() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return (

        <div>
            <Stack direction="row" alignItems="center" spacing={1}>
                <h1>Resource Page</h1>
                <IconButton variant="contained" aria-label="add">
                    <AddIcon />
                </IconButton>
            </Stack>


            <Grid container spacing={2}>
                {resources.map((resource) => (
                    <Grid item xs={12} sm={6} md={4} key={resource.name}>
                        <Card sx={{height: 350, display: "flex", flexDirection: "column"}}>

                            <CardActionArea sx={{flex: 1, display: "flex"}}>

                                {resource.type === "image" ? (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={resource.src}
                                        alt={resource.name}
                                        sx={{objectFit: "contain"}}
                                    />
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

                                        <InsertDriveFileIcon sx={{fontSize: 80}}/>
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
                                    aria-controls={open ? "long-menu" : undefined}
                                    aria-expanded={open ? "true" : undefined}
                                    aria-haspopup="true"
                                    onClick={handleClick}
                                >
                                    <MoreVertIcon/>
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
                                    <MenuItem onClick={handleClose} variant="contained" startIcon={<EditIcon />}>Modify</MenuItem>
                                    <MenuItem onClick={handleClose} variant="contained" startIcon={<DeleteIcon />}>Delete</MenuItem>
                                    <MenuItem onClick={handleClose}>Option 3</MenuItem>
                                </Menu>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </div>

        /*
        <div>
            <h1>Resource Page</h1>
            <p>This is the resource page content.</p>

            <Link to="/">
                <Button variant="contained">Back to Home</Button>
            </Link>
            <Button variant="contained" startIcon={<EditIcon />}>
                Modify
            </Button>

            <Button variant="contained" startIcon={<DeleteIcon />}>
                Delete
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
                Add
            </Button>
        </div>
        */

    );
}

export default ResourcePage;