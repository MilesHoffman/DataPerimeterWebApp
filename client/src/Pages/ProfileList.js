// ProfileList.js
import React, { useContext } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import ProfileContext from "../logic/profileLogic"; // Adjust the path if needed

const ProfileList = () => {
  const { profiles } = useContext(ProfileContext);

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Registered Profiles
      </Typography>
      {profiles.length === 0 ? (
        <Typography>No profiles available.</Typography>
      ) : (
        <List>
          {profiles.map((profile) => (
            <React.Fragment key={profile.name}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={profile.name}
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
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ProfileList;
