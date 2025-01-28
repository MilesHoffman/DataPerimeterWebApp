
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

const resources = [
    {
        name: 'Image 1',
        type: 'image',
        src: '../tempResources/testFile.txt',
    },
    {
        name: 'Document 1',
        type: 'document',
        src: '../tempResources/testImage1.jpg',
    },
    {
        name: 'Image 2',
        type: 'image',
        src: '../tempResources/testImage2.jpg',
    },

];
function ResourcePage() {
    return (

        <div>
            <h1>Resource Page</h1>

            <Grid container spacing={2}>

                {resources.map((resource) => (
                    <Grid item xs={12} sm={6} md={4} key={resource.name}>

                        <Card sx={{height: 300}}>

                            <CardActionArea>

                                {resource.type === "image" && (
                                    <CardMedia
                                        component="img"

                                        height="200"
                                        image={resource.src}
                                        alt={resource.name}
                                    />
                                )}
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="div">
                                        {resource.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resource.type}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
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