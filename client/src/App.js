import './App.css';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ResourcePage from './Pages/ResourcePage';
import React, { useState } from 'react';
import HomePage from './Pages/HomePage';
import {
    AppBar,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    IconButton,
    Tabs,
    Tab,
    CssBaseline,
    Container,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginPage from './Pages/LoginPage';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null); // Use null for no menu
    const open = Boolean(anchorEl);

    // Sets the profile menu position plus open/closes it
    const handleOpenProfileMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // ditto
    const handleCloseProfileMenu = () => {
        setAnchorEl(null);
    };

    // navigates to the selected tab
    const handleTabChange = (event, newValue) => {
        navigate(newValue);
    };

    // gets the current page title from path
    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
                return 'Homepage';
            case '/resourcePage':
                return 'Resource Page';
            case '/login':
                return 'Login';
            default:
                return 'Data Perimeter App';
        }
    };

    // Gets the current tab from path
    const getCurrentTab = () => {
        switch (location.pathname) {
            case '/':
                return '/';
            case '/resourcePage':
                return '/resourcePage';
            case '/login':
                return '/login';
            default:
                return '';
        }
    };

    // App bar for the website.
    const MyAppBar = () => {
        return (
            <AppBar position='fixed'>
                <Toolbar>
                    <Typography variant='h4' sx={{ flexGrow: 1 }}>
                        {getPageTitle()}
                    </Typography>

                    <Tabs value={getCurrentTab()} onChange={handleTabChange} textColor='inherit'>
                        <Tab label='Home' value='/' />
                        <Tab label='Login' value={'/login'} />
                        <Tab label='Resource Page (temp)' value='/resourcePage' />
                    </Tabs>

                    <IconButton
                        size='large'
                        edge='end'
                        color='inherit'
                        aria-label='profile'
                        onClick={handleOpenProfileMenu}
                    >
                        <AccountCircleIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleCloseProfileMenu}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem onClick={handleCloseProfileMenu}>Profile</MenuItem>
                        <MenuItem onClick={handleCloseProfileMenu}>My account</MenuItem>
                        <MenuItem onClick={handleCloseProfileMenu}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
        );
    };

    return (
        <div>
            <CssBaseline />

            {MyAppBar()}

            <Container maxWidth={'xl'} sx={{ mt: 10, mb: 3 }}>
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/resourcePage' element={<ResourcePage />} />
                    <Route path='/login' element={<LoginPage />} />
                </Routes>
            </Container>
        </div>
    );
}

export default App;