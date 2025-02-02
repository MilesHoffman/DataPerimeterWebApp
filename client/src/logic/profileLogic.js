import React, { createContext, useState } from "react";
import { Profile } from "../classes/profileClass";
import { flushSync } from "react-dom";

// Temporary simulated profiles
let dog_llc = new Profile("Dog LLC", [
  { name: "Happy Dogs", type: "S3 Bucket", files: 3, status: "compliant" },
  { name: "Dog EC2", type: "EC2 Instance", files: 0, status: "compliant" },
]);

let puppy_llc = new Profile("Puppy LLC", [
  { name: "Little Puppies", type: "S3 Bucket", files: 5, status: "compliant" },
  { name: "Puppy EC2", type: "EC2 Instance", files: 0, status: "compliant" },
]);

let competitor = new Profile("Competitor LLC", [
  { name: "Stolen Pics", type: "S3 Bucket", files: 3, status: "non-compliant" },
  {
    name: "Competitor EC2",
    type: "EC2 Instance",
    files: 0,
    status: "non-compliant",
  },
]);

// Lets us access profiles across the app.
const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  // temp values and initializing the profile var
  const [profiles, setProfiles] = useState([dog_llc, puppy_llc, competitor]);

  const tempId = profiles.length > 0 ? profiles[0] : null;
  const [currentProfile, setCurrentProfileVar] = useState(tempId);

  /* USE THE ADDPROFILE to add the profile that was created earlier */
  // Use this after a successful log in. Will need to be updated.
  const addProfile = (userId, profileData) => {
    const newProfile = new Profile(profileData.name);
    setProfiles([...profiles, newProfile]);

    setCurrentProfileVar(userId);
  };

  // Use this to log out
  const removeProfile = (name) => {
    const updatedProfiles = profiles.filter((profile) => profile.name !== name);
    setProfiles(updatedProfiles);

    // Update currentProfile if the removed profile was the current one
    if (currentProfile.name === name) {
      const nextProfileId =
        updatedProfiles.length > 0 ? updatedProfiles[0] : null;
      setCurrentProfileVar(nextProfileId);
    }
  };

  const removeAllProfiles = () => {
    setProfiles([]);
    setCurrentProfileVar(null);
  };

  // Sets the current profile to the specified userId of the profile
  const setCurrentProfile = (name) => {
    name = name.trim();
    console.log("Changing current profile to:", name);
    if (profiles.filter((profile) => profile.name === name)) {
      setCurrentProfileVar(profiles.find((profile) => profile.name === name));
    } else {
      console.log("Invalid profile name");
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        addProfile,
        removeProfile,
        setCurrentProfile,
        removeAllProfiles,
        currentProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext;
