import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Darkmode from 'darkmode-js';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [darkmodeInstance, setDarkmodeInstance] = useState(null);

    useEffect(() => {
        console.log('Utilisateur connecté dans Header :', user); 
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const options = {
            mixColor: '#fff',
            backgroundColor: '#fff',
            saveInCookies: true,
            autoMatchOsTheme: true,
        };

        const darkmode = new Darkmode(options);
        setDarkmodeInstance(darkmode);
    }, []);

    const toggleDarkMode = () => {
        if (darkmodeInstance) {
            darkmodeInstance.toggle();
        }
    };

    return (
        <header className="header">
            <h1 className="header-title" onClick={() => navigate('/')}>
                EVENTUDE
            </h1>
            <div className="header-actions">
                {user ? (
                    <>
                        <button className="button" onClick={() => navigate('/events')}>
                            Liste des événements
                        </button>
                        {user?.user_type === 'organisateur' && (
                            <button className="button" onClick={() => navigate('/create-event')}>
                                Créer un événement
                            </button>
                        )}
                    {}
                    <button className="button" onClick={() => navigate('/history')}>
                        Vos événement
                    </button>
                        <button
                            className="darkmode-button"
                            onClick={toggleDarkMode}
                            title="Activer/Désactiver le mode sombre"
                        >
                            🌓
                        </button>
                        <span className="welcome-message">Bienvenue, {user.username}</span>
                        <button onClick={handleLogout} className="button">
                            Déconnexion
                        </button>

                    </>
                ) : (
                    <>
                        <button className="button" onClick={() => navigate('/register')}>
                            Inscription
                        </button>
                        <button className="button" onClick={() => navigate('/login')}>
                            Connexion
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
