import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CreateEvent = () => {
    const { user } = useAuth();
    console.log('Utilisateur connecté :', user);

    const [formData, setFormData] = useState({
        event_name: '',
        description: '',
        location: '',
        date_event: '',
        max_participants: '', 
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const dataToSend = {
            ...formData,
            max_participants: parseInt(formData.max_participants, 10),
            created_by: user?.id_user,
        };
    
        console.log('Données envoyées :', dataToSend);
    
        if (!user?.id_user) {
            alert('Erreur : utilisateur non connecté ou ID utilisateur manquant.');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:5000/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
    
            if (response.ok) {
                alert('Événement créé avec succès !');
                setFormData({
                    event_name: '',
                    description: '',
                    location: '',
                    date_event: '',
                    max_participants: '',
                });
            } else {
                const errorData = await response.json();
                console.error('Erreur du serveur :', errorData);
                alert(errorData.message || 'Erreur lors de la création de l\'événement.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };
    
    return (
        <form id='createForm' onSubmit={handleSubmit}>
            <h1>Créer un événement</h1>
            <input
                type="text"
                placeholder="Nom de l'événement"
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                required
            />
            <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <input
                type="text"
                placeholder="Lieu"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
            />
            <input
                type="date"
                value={formData.date_event}
                onChange={(e) => setFormData({ ...formData, date_event: e.target.value })}
                required
            />
            <input
                type="number"
                placeholder="Nombre maximum de participants"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || '' })}
                required
            />
            <button type="submit">Créer l'événement</button>
        </form>
    );
};

export default CreateEvent;
