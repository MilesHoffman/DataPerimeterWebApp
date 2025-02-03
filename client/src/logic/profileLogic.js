import React, { createContext, useState } from "react";
import { Profile } from "../classes/profileClass";

// Temporary simulated profiles (if you wish to keep these for testing)
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

/* PROVIDER SHOULD STORE THE INSTANCE OF THE PROFILE CLASS */
export const ProfileProvider = ({ children }) => {
  // For testing you might start with some simulated profiles,
  // or start with an empty array if you wish to only add profiles on login.
  const [profiles, setProfiles] = useState([dog_llc, puppy_llc, competitor]);
  const initialProfile = profiles.length > 0 ? profiles[0] : null;
  const [currentProfile, setCurrentProfileVar] = useState(initialProfile);

  /* USE THE ADDPROFILE to add the profile that was created earlier (e.g. after a successful login)
     The profileData object should include:
       - name: typically the username,
       - resources: any resource data (or an empty array),
       - keys: the static credentials returned from Cognito. */
  const addProfile = (profileData) => {
    const newProfile = new Profile(
      profileData.name,
      profileData.resources || [],
      profileData.keys || {}
    );
    setProfiles([...profiles, newProfile]);
    setCurrentProfileVar(newProfile);
  };

  // Use this to log out
  const removeProfile = (name) => {
    const updatedProfiles = profiles.filter((profile) => profile.name !== name);
    setProfiles(updatedProfiles);

    // Update currentProfile if the removed profile was the current one
    if (currentProfile && currentProfile.name === name) {
      const nextProfile =
        updatedProfiles.length > 0 ? updatedProfiles[0] : null;
      setCurrentProfileVar(nextProfile);
    }
  };

  const removeAllProfiles = () => {
    setProfiles([]);
    setCurrentProfileVar(null);
  };

  // Sets the current profile to the specified profile name
  const setCurrentProfile = (name) => {
    name = name.trim();
    console.log("Changing current profile to:", name);
    const foundProfile = profiles.find((profile) => profile.name === name);
    if (foundProfile) {
      setCurrentProfileVar(foundProfile);
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
