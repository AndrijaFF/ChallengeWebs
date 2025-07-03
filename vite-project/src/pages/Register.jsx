import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
                
        if (!formData.username || !formData.email || !formData.password) {
        setError("Tous les champs sont obligatoires.");
        return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            alert("Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.");
            return;
        }

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <form className="form-register" onSubmit={handleSubmit} style={{ minHeight: '420px' }}>
                <h2>Inscription</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <input
                    className="input-info"
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                />
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
                <button className="button" type="submit" style={{ marginTop: '30px' }}>S'inscrire</button>
            </form>
            <span
                style={{ color: '#359DFF', cursor: 'pointer', fontWeight: 500, marginTop: '18px', textAlign: 'center' }}
                onClick={() => navigate('/login')}
            >
                Vous avez déjà un compte ?
            </span>
        </div>
    );
};

export default Register;
