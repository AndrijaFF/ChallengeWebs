import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        userType: 'participant',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Inscription réussie !');
                navigate('/login'); 
            } else if (response.status === 409) {
                setError('Cet utilisateur ou cet email existe déjà.');
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
        <form class="form-login" onSubmit={handleSubmit}>
            <h2>Inscription</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input
                class="input-info"
                type="text"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
            />
            <input
                class="input-info"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
            />
            <input
                class="input-info"
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
            />
            <select class="input-info"
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
            >
                <option value="participant">Participant</option>
                <option value="organisateur">Organisateur</option>
            </select>
            <button class="button" type="submit">S'inscrire</button>
        </form>
    );
};

export default Register;
