import './themes/appTheme.css';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ResourcePage from './Pages/ResourcePage';
import React, {useContext, useState} from 'react';
import HomePage from './Pages/HomePage';
import './themes/appTheme.css'
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
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import LoginPage from './Pages/LoginPage';
import ProfileContext, {profiles} from "./logic/profileLogic";

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

    const handleLoginNavigate = () => {
        navigate('/login')
        handleCloseProfileMenu()
    }

    // App bar for the website.
    const MyAppBar = () => {
        return (
            <AppBar position='fixed'>
                <Toolbar>
                    <Typography variant='h4' sx={{ flexGrow: 1 }}>
                        {getPageTitle()}
                    </Typography>

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
                        <MenuItem onClick={handleLoginNavigate}>Login</MenuItem>
                        <DisplayProfiles />
                        <MenuItem onClick={handleCloseProfileMenu}>Logout All</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
        );
    };

    const ProfileCard = ({ name, onClick }) => {
        return (
            <MenuItem onClick={onClick}>
                <Typography sx={{ flex: 1 }}>{name}</Typography>
                <IconButton>
                    <CloseIcon />
                </IconButton>
            </MenuItem>
        );
    };

    const DisplayProfiles = () => {
        const { profiles } = useContext(ProfileContext);

        return (
            <div>
                {Object.entries(profiles).map(([userId, profile]) => (
                    <ProfileCard key={userId} onClick={handleCloseProfileMenu} name={profile.name} />
                ))}
            </div>
        );
    };

    return (
        <div className='app-container'>
            <CssBaseline />
            {MyAppBar()}

            <div className='sidebar'>
                <Tabs
                    value={getCurrentTab()}
                    onChange={handleTabChange}
                    textColor='inherit'
                    orientation='vertical'
                >
                    <Tab label='Home' value='/' />
                    <Tab label='Login' value='/login' />
                    <Tab label='Resource Page (temp)' value='/resourcePage' />
                </Tabs>
            </div>

            <div className='content-area'>
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/resourcePage' element={<ResourcePage />} />
                    <Route path='/login' element={<LoginPage />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;