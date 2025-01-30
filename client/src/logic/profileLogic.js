import React, { createContext, useState } from 'react';
import { Profile } from "../classes/profileClass";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profiles, setProfiles] = useState({
        'Dog LLC': new Profile('Dog LLC', Date.now()),
        'Puppy LLC': new Profile('Puppy LLC', Date.now() - 1000),
    });

    const [currentProfileId, setCurrentProfileId] = useState(Object.keys(profiles)[0] || '');

    const addProfile = (userId, profileData) => {
        const newProfile = new Profile(profileData.name, Date.now());
        setProfiles(prevProfiles => ({ ...prevProfiles, [userId]: newProfile }));
        setCurrentProfile(userId);
    };

    const removeProfile = (userId) => {
        setProfiles(prevProfiles => {
            const updatedProfiles = { ...prevProfiles };
            delete updatedProfiles[userId];
            return updatedProfiles;
        });
        setCurrentProfile(Object.keys(profiles)[0] || '');
    };

    const setCurrentProfile = (userId) => {
        setProfiles(prevProfiles => {
            const updatedProfiles = {
                ...prevProfiles,
                [userId]: { ...prevProfiles[userId], lastActive: Date.now() }
            };
            return updatedProfiles;
        });
        setCurrentProfileId(userId);
    };

    return (
        <ProfileContext.Provider value={{ profiles, addProfile, removeProfile, setCurrentProfile, currentProfileId }}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileContext;
