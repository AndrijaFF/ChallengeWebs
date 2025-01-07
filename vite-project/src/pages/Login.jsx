import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth(); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 

        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const user = await response.json();
                login(user); 
                alert('Connexion réussie !');
                navigate('/'); 
            } else if (response.status === 401) {
                setError('Email ou mot de passe incorrect.');
            } else if (response.status === 400) {
                setError('Tous les champs sont requis.');
            } else {
                setError('Une erreur inattendue est survenue.');
            }
        } catch (err) {
            console.error('Erreur réseau :', err);
            setError('Impossible de se connecter au serveur. Vérifiez votre connexion.');
        }
    };

    return (
        <form className="form-register" onSubmit={handleSubmit}>
            <h2>Connexion</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input
                className="input-info"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
            />
            <input
                className="input-info"
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
            />
            <button className="button" type="submit">Se connecter</button>
        </form>
    );
};

export default Login;
