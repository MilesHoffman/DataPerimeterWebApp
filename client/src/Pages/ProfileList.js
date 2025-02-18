import React, { useContext } from "react";
// Importing Material UI components for layout and styling
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
// Importing the context that provides profile data
import ProfileContext from "../logic/profileLogic";

const ProfileList = () => {
  // Accessing profiles from the context
  const { profiles } = useContext(ProfileContext);

  return (
    // Box component for some padding around the content
    <Box p={2}>
      {/* Title of the list */}
      <Typography variant="h5" gutterBottom>
        Registered Profiles
      </Typography>
      {/* Check if there are profiles to display */}
      {profiles.length === 0 ? (
        // If no profiles, show a message
        <Typography>No profiles available.</Typography>
      ) : (
        // Otherwise, display the list of profiles
        <List>
          {profiles.map((profile) => (
            // React.Fragment used to wrap multiple elements without adding extra nodes
            <React.Fragment key={profile.name}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  // Display the profile name as the primary text
                  primary={profile.name}
                  // Secondary text shows keys and number of resources
                  secondary={
                    <>
                      <Typography variant="body2" color="textPrimary">
                        Keys: {JSON.stringify(profile.keys)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Resources: {profile.resources.length}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {/* Divider to separate each list item */}
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ProfileList;
