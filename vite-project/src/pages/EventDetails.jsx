import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [announcement, setAnnouncement] = useState("");
    const [postingAnnouncement, setPostingAnnouncement] = useState(false);

    // ✅ Fonction pour récupérer les détails de l'événement
    const fetchEventDetails = async () => {
        try {
            console.log(`🔍 Récupération des détails de l'événement ID: ${id}`);
            const response = await fetch(`http://localhost:5000/event/${id}/participants`);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des détails. Code: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ Détails récupérés :", data);
            setEventDetails(data);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des détails :", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const handlePostAnnouncement = async () => {
        if (!announcement.trim()) {
            alert("Le message ne peut pas être vide.");
            return;
        }

        setPostingAnnouncement(true);
        try {
            const response = await fetch(`http://localhost:5000/event/${id}/announce`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id_user, message: announcement }),
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la publication de l'annonce.");
            }

            const newAnnouncement = await response.json();
            setEventDetails(prevState => ({
                ...prevState,
                announcements: [...prevState.announcements, newAnnouncement]
            }));
            setAnnouncement("");
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de l'annonce :", error);
            alert("Impossible de poster l'annonce.");
        } finally {
            setPostingAnnouncement(false);
        }
    };

    if (loading) return <p>Chargement des détails...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!eventDetails) return <p>Événement non trouvé.</p>;

    return (
        <div className="event-details-container">
            <h1 className="event-title">{eventDetails.event.event_name}</h1>
            <p className="event-description">{eventDetails.event.description}</p>
            <p className="event-location">📍 {eventDetails.event.location}</p>
            <p className="event-date">📅 {new Date(eventDetails.event.date_event).toLocaleDateString()}</p>
            <p className="event-participants">👥 {eventDetails.participants.length} / {eventDetails.event.max_participants} participants</p>

            {/* Liste des participants */}
            <div className="participants-section">
                <h2>Participants</h2>
                <ul className="participants-list">
                    {eventDetails.participants.length > 0 ? (
                        eventDetails.participants.map((participant) => (
                            <li key={participant.id_user}>{participant.username}</li>
                        ))
                    ) : (
                        <p>Aucun participant pour le moment.</p>
                    )}
                </ul>
            </div>

            {/* Section Annonces */}
            <div className="announcements-section">
                <h2>Annonces</h2>
                <ul className="announcements-list">
                    {eventDetails.announcements.length > 0 ? (
                        eventDetails.announcements.map((announcement, index) => (
                            <li key={index}>
                                <strong>{announcement.username} :</strong> {announcement.message}
                            </li>
                        ))
                    ) : (
                        <p>Aucune annonce pour cet événement.</p>
                    )}
                </ul>

                {/* Bouton + Formulaire de publication d'annonce (Réservé à l'organisateur) */}
                {user?.id_user === eventDetails.event.created_by && (
                    <div className="announcement-form">
                        <button 
                            className="button post-announcement-button"
                            onClick={handlePostAnnouncement}
                            disabled={postingAnnouncement}
                        >
                            {postingAnnouncement ? "Publication en cours..." : "📢 Poster une annonce"}
                        </button>
                        <textarea
                            className="announcement-input"
                            placeholder="Rédigez une annonce..."
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetails;
