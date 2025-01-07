import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EditEvent = () => {
    const { id } = useParams(); 
    const [formData, setFormData] = useState({
        event_name: '',
        description: '',
        location: '',
        date_event: '',
        max_participants: '',
    });
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`http://localhost:5000/events/${id}`);
                const data = await response.json();
                setFormData(data);
            } catch (err) {
                console.error('Erreur lors de la récupération de l\'événement :', err);
            }
        };

        fetchEvent();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId: user.id_user }),
            });

            if (response.ok) {
                alert('Événement modifié avec succès.');
                navigate('/events');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de la modification de l\'événement.');
            }
        } catch (err) {
            console.error('Erreur réseau :', err);
        }
    };

    return (
        <form className='editForm' onSubmit={handleSubmit}>
            <h1>Modifier l'événement</h1>
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
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                required
            />
            <button type="submit">Modifier</button>
        </form>
    );
};

export default EditEvent;
