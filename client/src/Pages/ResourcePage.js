
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
function ResourcePage() {
    return (
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
    );
}

export default ResourcePage;