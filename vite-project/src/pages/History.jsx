import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/Authcontext';
import EventCard from '../components/EventCard'; 
import '../styles/History.css';

const History = () => {
    const { user } = useAuth();
    const [createdEvents, setCreatedEvents] = useState([]);
    const [futureEvents, setFutureEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [userRegistrations, setUserRegistrations] = useState([]); 
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        if (!user || !user.id_user) {
            console.error("ID utilisateur non défini !");
            return;
        }

        console.log("Requête du user:" + user.id_user);

        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/history/${user.id_user}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                 throw new Error(`Erreur: ${response.status}`);
                }
                const data = await response.json();

                const today = new Date().setHours(0, 0, 0, 0);
                const future = [];
                const past = [];

                data.registeredEvents.forEach(event => {
                    const eventDate = new Date(event.date_event).setHours(0, 0, 0, 0);
                    if (eventDate >= today) {
                        future.push(event);
                    } else {
                        past.push(event);
                    }
                });

                const sortByDate = (events) => {
                    return events.sort((a, b) => new Date(a.date_event) - new Date(b.date_event));
                };

                setCreatedEvents(sortByDate(data.createdEvents));
                setFutureEvents(sortByDate(future));
                setPastEvents(sortByDate(past));

                setUserRegistrations(data.registeredEvents.map(event => event.id_event));
            } catch (error) {
                console.error('Erreur lors de la récupération des événements :', error);
            }
        };

        fetchHistory();
    }, [user]);

    return (
        <div id="history-container">
            <h1 className="history-title">Vos événements</h1>
    
            <div className="history-columns">
                {/* Colonne des événements créés */}
                <div className="history-section" id="created-events">
                    <h2>Événements créés</h2>
                    {createdEvents.length > 0 ? (
                        <ul className="history-list">
                            {createdEvents.map(event => (
                                <EventCard 
                                    key={event.id_event}
                                    event={event}
                                    user={user}
                                    handleRegister={() => {}}
                                    handleEdit={() => {}}
                                    handleDelete={() => {}}
                                    handleUpdate={() => {}}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="no-events">Aucun événement créé.</p>
                    )}
                </div>
    
                {/* Colonne des événements à venir */}
                <div className="history-section" id="future-events">
                    <h2>Événements à venir</h2>
                    {futureEvents.length > 0 ? (
                        <ul className="history-list">
                            {futureEvents.map(event => (
                                <EventCard 
                                    key={event.id_event}
                                    event={event}
                                    user={user}
                                    userRegistrations={userRegistrations} 
                                    handleRegister={() => {}}
                                    handleEdit={() => {}}
                                    handleDelete={() => {}}
                                    handleUpdate={() => {}}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="no-events">Aucun événement à venir.</p>
                    )}
                </div>
    
                {/* Colonne des événements passés */}
                <div className="history-section" id="past-events">
                    <h2>Événements auxquels vous avez participé</h2>
                    {pastEvents.length > 0 ? (
                        <ul className="history-list">
                            {pastEvents.map(event => (
                                <EventCard 
                                    key={event.id_event}
                                    event={event}
                                    user={user}
                                    userRegistrations={userRegistrations} 
                                    handleRegister={() => {}}
                                    handleEdit={() => {}}
                                    handleDelete={() => {}}
                                    handleUpdate={() => {}}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="no-events">Aucun événement passé.</p>
                    )}
                </div>
            </div>
        </div>
    );
}    
export default History;
