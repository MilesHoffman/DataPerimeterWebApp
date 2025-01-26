// ResourcePage.js

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';


function ResourcePage() {
    return (
        <div>
            <h1>Resource Page</h1>
            <p>This is the resource page content.</p>

            <Link to="/">
                <Button variant="contained">Back to Home</Button>
            </Link>
        </div>
    );
}

export default ResourcePage;