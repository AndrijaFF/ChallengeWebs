import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import menuIcon from '../img/menu.png';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        console.log('Utilisateur connecté dans Header :', user); 
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMenuOpen(false);
    };

    // Fermer le menu lors d'un resize desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navLinks = user ? (
        <>
            <button className="button" onClick={() => {navigate('/events'); setMenuOpen(false);}}>
                Liste des événements
            </button>
            <button className="button" onClick={() => {navigate('/create-event'); setMenuOpen(false);}}>
                Créer un événement
            </button>
            <button className="button" onClick={() => {navigate('/history'); setMenuOpen(false);}}>
                Vos événement
            </button>
        </>
    ) : (
        <>
            <button className="button" onClick={() => {navigate('/register'); setMenuOpen(false);}}>
                Inscription
            </button>
            <button className="button" onClick={() => {navigate('/login'); setMenuOpen(false);}}>
                Connexion
            </button>
        </>
    );

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title" onClick={() => navigate('/')}>EVENTUDE</h1>
            </div>
            <div className="header-center desktop-nav">
                {navLinks}
            </div>
            {user && (
                <div className="header-right desktop-nav">
                    <span className="welcome-message">Bienvenue, {user.username}</span>
                    <button onClick={handleLogout} className="button">Déconnexion</button>
                </div>
            )}
            <div className="burger-menu" onClick={() => setMenuOpen(!menuOpen)}>
                <img src={menuIcon} alt="Menu" />
            </div>
            {menuOpen && (
                <div className="mobile-nav">
                    <button className="close-mobile-nav" onClick={() => setMenuOpen(false)}>&times;</button>
                    {user && <span className="welcome-message">Bienvenue, {user.username}</span>}
                    {navLinks}
                    {user && <button onClick={handleLogout} className="button">Déconnexion</button>}
                </div>
            )}
        </header>
    );
};

export default Header;
