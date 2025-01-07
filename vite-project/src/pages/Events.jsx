import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar'; 
import { useNavigate } from 'react-router-dom';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [userRegistrations, setUserRegistrations] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [editingEvent, setEditingEvent] = useState(null); 
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://localhost:5000/events');
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des événements.');
                }
                const data = await response.json();
                setEvents(data);
                setFilteredEvents(data);
            } catch (error) {
                console.error('Erreur lors de la récupération des événements :', error);
            }
        };

        const fetchUserRegistrations = async () => {
            try {
                const response = await fetch(`http://localhost:5000/registrations/user/${user.id_user}`);
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des inscriptions.');
                }
                const data = await response.json();
                setUserRegistrations(data.map(reg => reg.id_event));
            } catch (error) {
                console.error('Erreur lors de la récupération des inscriptions :', error);
            }
        };

        if (user) {
            fetchEvents();
            fetchUserRegistrations();
        }
    }, [user]);

    const handleSearch = (term) => {
        const lowercasedTerm = term.toLowerCase();
        const filtered = events.filter((event) =>
            event.event_name.toLowerCase().includes(lowercasedTerm) ||
            event.description.toLowerCase().includes(lowercasedTerm) ||
            event.location.toLowerCase().includes(lowercasedTerm)
        );
        setFilteredEvents(filtered);
    };

    const handleRegister = async (id_event) => {
        try {
            const response = await fetch(`http://localhost:5000/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_event, id_user: user.id_user }),
            });

            if (response.ok) {
                alert('Inscription réussie !');
                setUserRegistrations([...userRegistrations, id_event]);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de l\'inscription.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };

    const handleDelete = async (id_event) => {
        try {
            const response = await fetch(`http://localhost:5000/events/${id_event}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id_user }),
            });

            if (response.ok) {
                alert('Événement supprimé avec succès.');
                setEvents(events.filter(event => event.id_event !== id_event));
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de la suppression de l\'événement.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event); // Passer l'événement en mode édition
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/events/${editingEvent.id_event}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingEvent, userId: user.id_user }),
            });

            if (response.ok) {
                alert('Événement mis à jour avec succès.');
                setEditingEvent(null);
                const updatedEvent = await response.json();
                setEvents(events.map(event => (event.id_event === updatedEvent.id_event ? updatedEvent : event)));
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de la mise à jour de l\'événement.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };

    return (
        <div>
            <h1>Liste des événements</h1>
            <SearchBar onSearch={(term) => {
                const lowercasedTerm = term.toLowerCase();
                const filtered = events.filter((event) =>
                    event.event_name.toLowerCase().includes(lowercasedTerm) ||
                    event.description.toLowerCase().includes(lowercasedTerm) ||
                    event.location.toLowerCase().includes(lowercasedTerm)
                );
                setFilteredEvents(filtered);
            }} />
            <ul>
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <li key={event.id_event}>
                            {editingEvent && editingEvent.id_event === event.id_event ? (
                                <form onSubmit={handleUpdate}>
                                    <input
                                        type="text"
                                        value={editingEvent.event_name}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
                                        required
                                    />
                                    <textarea
                                        value={editingEvent.description}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        value={editingEvent.location}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="date"
                                        value={editingEvent.date_event}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, date_event: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="number"
                                        value={editingEvent.max_participants}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, max_participants: e.target.value })}
                                        required
                                    />
                                    <button type="submit" className='button'>Enregistrer</button>
                                    <button type="button" className='button' onClick={() => setEditingEvent(null)}>Annuler</button>
                                </form>
                            ) : (
                                <>
                                    <h3>{event.event_name}</h3>
                                    <p>{event.description}</p>
                                    <p>Lieu : {event.location}</p>
                                    <p>Date : {new Date(event.date_event).toLocaleDateString()}</p>
                                    <p>Participants max : {event.max_participants}</p>

                                    {/* Affichage "Inscrit" ou bouton d'inscription */}
                                    {userRegistrations.includes(event.id_event) ? (
                                        <p>Inscrit</p>
                                    ) : (
                                        user?.id_user !== event.created_by && (
                                            <button className='button' onClick={() => handleRegister(event.id_event)}>S'inscrire</button>
                                        )
                                    )}

                                    {/* Bouton de modification */}
                                    {user?.id_user === event.created_by && (
                                        <button className='button' onClick={() => handleEdit(event)}>Modifier</button>
                                    )}
                                </>
                            )}
                        </li>
                    ))
                ) : (
                    <p>Aucun événement trouvé.</p>
                )}
            </ul>
        </div>
    );
};
export default Events;
