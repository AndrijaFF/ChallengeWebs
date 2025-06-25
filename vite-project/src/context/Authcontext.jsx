import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        console.log('localStorage :', parsedUser);
        return parsedUser;
    });

    const login = (userData) => {
        if (!userData.id_user) {
            console.error('Erreur: l\'ID utilisateur (id_user) manque.');
            return;
        }
        console.log('Données user :', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };
    
    console.log('User localStorage :', JSON.parse(localStorage.getItem('user')));
    

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user'); 
        localStorage.removeItem('token');

    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
