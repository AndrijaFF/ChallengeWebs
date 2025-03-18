import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <section className="hero">
                <h1>Organisez et participez à des événements facilement</h1>
                <p>Rejoignez notre plateforme pour découvrir des événements incroyables et rencontrer des passionnés.</p>
                <button className="button" onClick={() => navigate('/events')}>Découvrir les événements</button>
            </section>

            <section className="why-choose-us">
                <h2>Pourquoi utiliser Eventude ?</h2>
                <div className="features">
                    <div className="feature-card">
                        <h3>🔎 Trouvez des événements</h3>
                        <p>Explorez des événements dans votre région et participez en quelques clics.</p>
                    </div>
                    <div className="feature-card">
                        <h3>📅 Organisez vos propres événements</h3>
                        <p>Créez un événement, gérez les inscriptions et échangez avec les participants.</p>
                    </div>
                    <div className="feature-card">
                        <h3>💬 Communauté dynamique</h3>
                        <p>Recevez des annonces en temps réel et échangez avec les organisateurs.</p>
                    </div>
                </div>
            </section>

            <section className="cta">
                <h2>Prêt à rejoindre l'aventure ?</h2>
                <button className="button" onClick={() => navigate('/register')}>Inscrivez-vous gratuitement</button>
            </section>
        </div>
    );
};

export default Home;
