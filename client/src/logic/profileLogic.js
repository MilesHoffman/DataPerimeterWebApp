import React, { createContext, useState } from 'react';
import {Profile} from "../classes/profileClass";



// Lets us access profiles across the app.
const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {

	// temp values and initializing the profile var
	const [profiles, setProfiles] = useState({
		'Dog LLC': new Profile('Dog LLC'),
		'Puppy LLC': new Profile('Puppy LLC'),
	});

	// todo: This holds the current selected profile
	const tempId = Object.keys(profiles).length > 0 ? Object.keys(profiles)[0] : '';
	const [currentProfileId, setCurrentProfileId] = useState(tempId);


	// Use this after a successful log in
	const addProfile = (userId, profileData) => {
		const newProfile = new Profile(profileData.name);
		setProfiles({ ...profiles, [userId]: newProfile });

		setCurrentProfile(userId)
	};

	// Use this to log out
	const removeProfile = (userId) => {
		const updatedProfiles = { ...profiles };
		delete updatedProfiles[userId];
		setProfiles(updatedProfiles);

		if (currentProfileId === userId){
			const profileIds = Object.keys(profiles);
			let nextUserId = '';

			if (profileIds.length > 0){
				nextUserId = profileIds[0];
			}

			setCurrentProfile(nextUserId)
		}
	};

	// Sets the current profile to the specified userId of the profile
	const setCurrentProfile = (userId) => {
		setCurrentProfileId(userId)
	}

	return (
		<ProfileContext.Provider
			value={{
				profiles,
				addProfile,
				removeProfile,
				setCurrentProfile,
				currentProfileId
		}}>
			{children}
		</ProfileContext.Provider>
	);
};

export default ProfileContext;