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

        // Pagination
        const [currentPage, setCurrentPage] = useState(1);
        const eventsPerPage = 6;

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
                window.location.reload();
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
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erreur lors de la mise à jour de l\'événement.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
        }
    };

    // Pagination - Calcul des événements à afficher
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    // Changer de page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="events-container">
            <h1 className="events-title">Liste des événements</h1>

            {/* Barre de recherche */}
            <SearchBar
                onSearch={(term) => {
                    const lowercasedTerm = term.toLowerCase();
                    const filtered = events.filter(event =>
                        event.event_name.toLowerCase().includes(lowercasedTerm) ||
                        event.description.toLowerCase().includes(lowercasedTerm) ||
                        event.location.toLowerCase().includes(lowercasedTerm)
                    );
                    setFilteredEvents(filtered);
                    setCurrentPage(1); // Réinitialisation à la page 1
                }}
            />

            {/* Affichage des événements */}
            <ul className="events-list">
                {currentEvents.length > 0 ? (
                    currentEvents.map((event) => (
                        <EventCard key={event.id_event} event={event} user={user} />
                    ))
                ) : (
                    <p className="no-events">Aucun événement trouvé.</p>
                )}
            </ul>

            {/* Pagination */}
            <div className="pagination">
                {Array.from({ length: Math.ceil(filteredEvents.length / eventsPerPage) }, (_, i) => (
                    <button
                        key={i}
                        className={`page-button ${currentPage === i + 1 ? "active" : ""}`}
                        onClick={() => paginate(i + 1)}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};


export default Events;
