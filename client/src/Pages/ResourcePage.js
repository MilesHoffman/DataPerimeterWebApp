
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
import axios from "axios";
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

    const handleTest = async () => {
        const response = await axios.post("http://localhost:5000/api/resource", {
            accessKeyId: 'ASIAVIOZFWO2ICG57MKK',
            secretAccessKey: 'q0PwxSHXvjRi8/DPhbeLVq4tvn3gvZyTbfEMYTIn',
            sessionToken: 'IQoJb3JpZ2luX2VjEA0aCXVzLWVhc3QtMiJHMEUCIDbgGYoLHKgSeS2iHlk7DbbMaFRXnovX3iwbtI5UEwaXAiEA4ffU7s1m5QA3KJqYkW7EnTflKRORRg8gv32L0uUGe0MqxAQIJhAAGgwzNjE3Njk1Nzk0NDQiDN//pL/0y+XLyLXEUyqhBJI6lC8iS7AOfS64zUZlJj2FIalh1ye7oDWR8qT7T2ygzBh0n//8zTkf3uIK7oXCBaHBgkVTmnZvsD5e056EnntNQ6GLWXX3WLyy/9M602Gk4tnxktCunj7Ag7TJ4CFLoP8QeUMrRCxC5ZIaeqxiKD06DLggJxqYDr+LRUP/+Q4DWJ9mHY24GMWjnlFbonBz/zG6zy0bzxV7pKNiJJYnYcPH999V/9/A0B3Rh+4Q5q7T+1zhmJK0I5jwQ+10wWQZTZv7Fka53P8i9oEXcactcJIZTNqF1cO0CZrP03c81AFCMG+iD0eQCpPjOV/fd+KlL/l4cBTOhjug44+zjxk86hD0G1cxYZOTds/n4d/ezIwQ98c8k3LahWrKGYFIOd4Lo1LgZd0CndOD5mXzG4TNwaKjXacftBjbDyI8G9aNogdAJQ055HbrOI8e6CbtQhZvpKP6XZ5Z3IUtDSe8DnfU0qpDPdjQJcQ7maPgam+3FmIhDUq4FNPkKNMa1FC8y2WyX/pmOEhP6GFv6yPbLK3Vq3XhoYw0lJPsU2XslSsQuC1pd7UA3i1SceG0Ju4u3W/gn5C6GJTNETgIvgqYzFgSVc7C6jScLrxukU3H+i0s/Ohy6SZIbNF+F+LCJtvJ+ZigIE9fACyDwrfGj2TKvmO+g05WukaR1UnMol+v23slc9z5SfhnYc6JHe58sdcqzE1s5tUKEckogt20+5SnuqKrdQ5qMM22hr0GOoUCh1yx0Yc6rHE7GLNrDEE6x7rGgTkEJaldtgtptZnNVhla/Ar9CfIaMwJQgDXLfVJ2R4dXF7DO2yPNiS1N2U3sBkYCnPKvwLJtf5N1pwJ6WV7GrYWrq5KxrPT4tns+osU/D+b6+Dyz5a4ZxixV0IwcNIOBAV73COznq4vOKcRBNTMHRFFnLhJFGyiEvUnh378fBw3mq2rbINmgT9Bwfbf19vVCAI7YRwBEQJDIPRMKC1zu9+GvbPworrBPMTk9FyGbCNtEHuEiZ29q9ggesk1eXqhezAFUQM4rmHkKzZk4DJlRQS6qRXrp1k5BM0qAAUOw86+ZDur7i29CQ+UL1zPmQuQUz7QS',
            bucketName: "puppy-pics-s3"

        });

        console.log(response)
    };
    return (

        <div>
            <Stack direction="row" alignItems="center" spacing={1}>
                <h1>Resource Page</h1>
                <IconButton onClick={handleTest} variant="contained" aria-label="add">
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