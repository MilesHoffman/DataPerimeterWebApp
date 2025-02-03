// App.js
import "./themes/appTheme.css";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import ResourcePage from "./Pages/ResourcePage";
import React, { useContext, useState } from "react";
import HomePage from "./Pages/HomePage";
import "./themes/appTheme.css";
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
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloseIcon from "@mui/icons-material/Close";
import LoginPage from "./Pages/LoginPage";
import Policies from "./Pages/Policies";
import ProfileContext from "./logic/profileLogic";
import ProfileList from "./Pages/ProfileList"; // This displays all profiles

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null); // Use null for no menu
  const open = Boolean(anchorEl);

  // Sets the profile menu position plus open/closes it
  const handleOpenProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close profile menu
  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
  };

  // Navigates to the selected tab
  const handleTabChange = (event, newValue) => {
    navigate(newValue);
  };

  // Gets the current page title from path
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Homepage";
      case "/resourcePage":
        return "Resource Page";
      case "/login":
        return "Login";
      case "/policies":
        return "Policies";
      case "/profiles":
        return "Profiles";
      default:
        return "Data Perimeter App";
    }
  };

  // Gets the current tab from path
  const getCurrentTab = () => {
    switch (location.pathname) {
      case "/":
        return "/";
      case "/resourcePage":
        return "/resourcePage";
      case "/login":
        return "/login";
      case "/policies":
        return "/policies";
      case "/profiles":
        return "/profiles";
      default:
        return "";
    }
  };

  const handleLoginNavigate = () => {
    navigate("/login");
    handleCloseProfileMenu();
  };

  // App bar for the website.
  const MyAppBar = () => {
    const { removeAllProfiles, currentProfile } = useContext(ProfileContext);

    const handleLogoutAll = () => {
      removeAllProfiles();
      handleCloseProfileMenu();
    };

    return (
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>

          <Typography variant={"h5"} color={"textPrimary"} sx={{ mr: 2 }}>
            {currentProfile ? currentProfile.name : ""}
          </Typography>

          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="profile"
            onClick={handleOpenProfileMenu}
          >
            <AccountCircleIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseProfileMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem onClick={handleLoginNavigate}>Login</MenuItem>
            <DisplayProfiles />
            <MenuItem onClick={handleLogoutAll}>Logout All</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    );
  };

  const ProfileCard = ({ name, onClick }) => {
    const { currentProfile, setCurrentProfile, removeProfile } =
      useContext(ProfileContext);

    // Sets the current profile
    const handleProfileCardClick = () => {
      setCurrentProfile(name);
      onClick();
    };

    // Logs out the profile
    const handleLogout = (event) => {
      event.stopPropagation(); // Prevent event bubbling
      removeProfile(name);
      onClick();
    };

    return (
      <MenuItem onClick={handleProfileCardClick}>
        <Typography
          sx={{
            flex: 1,
            fontWeight:
              currentProfile && currentProfile.name === name
                ? "bold"
                : "normal",
          }}
        >
          {name}
        </Typography>
        <IconButton onClick={handleLogout}>
          <CloseIcon />
        </IconButton>
      </MenuItem>
    );
  };

  const DisplayProfiles = () => {
    const { profiles } = useContext(ProfileContext);

    return (
      <div>
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.name}
            onClick={handleCloseProfileMenu}
            name={profile.name}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="app-container">
      <CssBaseline />
      {MyAppBar()}
      <div className="sidebar">
        <Tabs
          value={getCurrentTab()}
          onChange={handleTabChange}
          textColor="inherit"
          orientation="vertical"
        >
          <Tab label="Home" value="/" />
          <Tab label="Login" value="/login" />
          <Tab label="Resource Page (temp)" value="/resourcePage" />
          <Tab label="Policies" value="/policies" />
          <Tab label="Profiles" value="/profiles" />
        </Tabs>
      </div>
      <div className="content-area">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resourcePage" element={<ResourcePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/profiles" element={<ProfileList />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
