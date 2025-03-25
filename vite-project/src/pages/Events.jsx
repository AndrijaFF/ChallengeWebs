import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar'; 
import EventCard from '../components/EventCard'; 
import { useNavigate } from 'react-router-dom';
import "../styles/Events.css";

const Events = () => {
    const [events, setEvents] = useState([]);
    const [userRegistrations, setUserRegistrations] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]); 
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
        if (!window.confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

        try {
            const response = await fetch(`http://localhost:5000/events/${id_event}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id_user }),
            });

            if (response.ok) {
                alert('Événement supprimé avec succès.');
                setEvents(events.filter(event => event.id_event !== id_event));
                setFilteredEvents(filteredEvents.filter(event => event.id_event !== id_event));
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de la suppression de l\'événement.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };

    const handleUpdate = async (updatedEvent) => {
        try {
            const response = await fetch(`http://localhost:5000/events/${updatedEvent.id_event}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updatedEvent, userId: user.id_user }),
            });

            if (response.ok) {
                alert('Événement mis à jour avec succès.');
                const updatedData = await response.json();
                setEvents(events.map(event => (event.id_event === updatedData.id_event ? updatedData : event)));
                setFilteredEvents(filteredEvents.map(event => (event.id_event === updatedData.id_event ? updatedData : event)));
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de la mise à jour de l\'événement.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };

    return (
        <div className="events-container">
            <h1 className="events-title">Liste des événements</h1>

            <SearchBar
                onSearch={(term) => {
                    const lowercasedTerm = term.toLowerCase();
                    const filtered = events.filter(event =>
                        event.event_name.toLowerCase().includes(lowercasedTerm) ||
                        event.description.toLowerCase().includes(lowercasedTerm) ||
                        event.location.toLowerCase().includes(lowercasedTerm)
                    );
                    setFilteredEvents(filtered);
                }}
            />

        <ul className="events-list">
                {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                    <EventCard
                        key={event.id_event}
                        event={event}
                        user={user}
                        userRegistrations={userRegistrations}
                        handleRegister={handleRegister}
                        handleEdit={() => {}}
                        handleDelete={handleDelete}
                        handleUpdate={handleUpdate}
                    />
                ))
            ) : (
                    <p className="no-events">Aucun événement trouvé.</p>
            )}
            </ul>
        </div>
    );
};

export default Events;
