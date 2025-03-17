import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const EventCard = ({ event, user, userRegistrations, handleRegister, handleEdit, handleDelete, handleUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [editedEvent, setEditedEvent] = useState(event);
    const navigate = useNavigate();

    const handleSave = async (e) => {
        e.preventDefault();
        await handleUpdate(editedEvent);
        setEditing(false);
    };

    return (
        <li className="event-card">
            {editing ? (
                <form onSubmit={handleSave} className="edit-event-form">
                    <input
                        type="text"
                        value={editedEvent.event_name}
                        onChange={(e) => setEditedEvent({ ...editedEvent, event_name: e.target.value })}
                        required
                    />
                    <textarea
                        value={editedEvent.description}
                        onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                    />
                    <input
                        type="text"
                        value={editedEvent.location}
                        onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                        required
                    />
                    <input
                        type="date"
                        value={editedEvent.date_event}
                        onChange={(e) => setEditedEvent({ ...editedEvent, date_event: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        value={editedEvent.max_participants}
                        onChange={(e) => setEditedEvent({ ...editedEvent, max_participants: e.target.value })}
                        required
                    />
                    <button type="submit" className="button">Enregistrer</button>
                    <button type="button" className="button" onClick={() => setEditing(false)}>Annuler</button>
                </form>
            ) : (
                <>
                    <h3 className="event-title">{event.event_name}</h3>
                    <p className="event-description">{event.description}</p>
                    <p className="event-location">📍 {event.location}</p>
                    <p className="event-date">📅 {new Date(event.date_event).toLocaleDateString()}</p>
                    <p className="event-participants">👥 {event.current_participants} / {event.max_participants} participants</p>

                    {/* Affichage "Inscrit" ou bouton d'inscription */}
                    {userRegistrations.includes(event.id_event) ? (
                        <p className="event-status">✅ Inscrit</p>
                    ) : (
                        user?.id_user !== event.created_by && (
                            <button className="button" onClick={() => handleRegister(event.id_event)}>S'inscrire</button>
                        )
                    )}

                    {/* Boutons de modification et suppression */}
                    {user?.id_user === event.created_by && (
                        <div>
                            <button className="button" onClick={() => setEditing(true)}>Modifier</button>
                            <button className="button delete-button" onClick={() => handleDelete(event.id_event)}>Supprimer</button>
                        </div>
                    )}
                </>
            )}
            <button className="button details-button" onClick={() => navigate(`/event/${event.id_event}`)}>Détails</button>
        </li>
    );
};

export default EventCard;
