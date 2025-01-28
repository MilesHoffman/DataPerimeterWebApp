import React, { createContext, useState } from 'react';
import {Profile} from "../classes/profileClass";



// Lets us access profiles across the app.
const ProfileContext = createContext();
const CurrentProfileContext = createContext()

export const ProfileProvider = ({ children }) => {

	// temp values and initializing the profile var
	const [profiles, setProfiles] = useState({
		'user123': new Profile('John Doe'),
		'user456': new Profile('Jane Smith'),
	});

	// todo: This holds the current selected profile
	const [currentProfileId, setCurrentProfile] = useState()

	// Use this after a successful log in
	const addProfile = (userId, profileData) => {
		const newProfile = new Profile(profileData.name, profileData.age, profileData.city);
		setProfiles({ ...profiles, [userId]: newProfile });
	};

	// Use this to log out
	const removeProfile = (userId) => {
		const updatedProfiles = { ...profiles };
		delete updatedProfiles[userId];
		setProfiles(updatedProfiles);
	};

	return (
		<ProfileContext.Provider value={{ profiles, addProfile, removeProfile }}>
			{children}
		</ProfileContext.Provider>
	);
};

export default ProfileContext;