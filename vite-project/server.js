import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'eventude'
});
console.log('Connecté à la base de données.');

// POST REGISTER
app.post('/register', async (req, res) => {
    const { username, email, password, userType } = req.body;

    if (!username || !email || !password || !userType) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const query = 'INSERT INTO users (username, email, password, user_type) VALUES (?, ?, ?, ?)';
    try {
        await db.execute(query, [username, email, password, userType]);
        res.status(201).json({ message: 'Utilisateur inscrit avec succès.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Cet utilisateur ou cet email existe déjà.' });
        } else {
            console.error(err);
            res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
    }
});

// POST LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const query = 'SELECT id_user, username, email, user_type FROM users WHERE email = ? AND password = ?';
    
    try {
        const [rows] = await db.execute(query, [email, password]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const user = rows[0];
        res.status(200).json(user); 
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la connexion.' });
    }
});

app.get('/history/:id_user', async (req, res) => {
    const { id_user } = req.params;

    if (!id_user) {
        return res.status(400).json({ message: "ID utilisateur manquant." });
    }

    try {
        // Vérifier si l'utilisateur existe avant de récupérer son historique
        const [userExists] = await db.query(`SELECT id_user FROM users WHERE id_user = ?`, [id_user]);

        if (userExists.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Récupérer les événements créés par l'utilisateur
        const [createdEvents] = await db.query(`
            SELECT events.*, 
                (SELECT COUNT(*) FROM registrations WHERE registrations.id_event = events.id_event) AS current_participants
            FROM events 
            WHERE created_by = ?
        `, [id_user]);

        // Récupérer les événements auxquels l'utilisateur est inscrit
        const [registeredEvents] = await db.query(`
            SELECT events.*, 
                (SELECT COUNT(*) FROM registrations WHERE registrations.id_event = events.id_event) AS current_participants
            FROM registrations
            JOIN events ON registrations.id_event = events.id_event
            WHERE registrations.id_user = ?
        `, [id_user]);

        res.status(200).json({ createdEvents, registeredEvents });
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: "Erreur lors de la récupération de l'historique des événements." });
    }
});




app.post('/events', async (req, res) => {
    console.log('Données reçues dans la requête POST :', req.body); 

    const { event_name, description, location, date_event, max_participants, created_by } = req.body;

    if (!event_name || !location || !date_event || !created_by || max_participants < 1) {
        return res.status(400).json({ message: 'Tous les champs requis ne sont pas remplis.' });
    }

    try {
        const query = `
            INSERT INTO events (event_name, description, location, date_event, max_participants, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        await db.execute(query, [event_name, description, location, date_event, max_participants, created_by]);
        res.status(201).json({ message: 'Événement créé avec succès.' });
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la création de l\'événement.' });
    }
});


app.get('/events', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                events.*,
                users.username AS created_by_name,
                (SELECT COUNT(*) FROM registrations WHERE registrations.id_event = events.id_event) AS current_participants
            FROM events
            LEFT JOIN users ON events.created_by = users.id_user
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements.' });
    }
});



app.get('/registrations/user/:id_user', async (req, res) => {
    const { id_user } = req.params;

    try {
        const [rows] = await db.query('SELECT id_event FROM registrations WHERE id_user = ?', [id_user]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions.' });
    }
});


app.post('/registrations', async (req, res) => {
    const { id_event, id_user } = req.body;

    if (!id_event || !id_user) {
        return res.status(400).json({ message: 'L\'ID de l\'événement et l\'ID de l\'utilisateur sont requis.' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM registrations WHERE id_event = ? AND id_user = ?', [id_event, id_user]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement.' });
        }

        const [event] = await db.query('SELECT max_participants FROM events WHERE id_event = ?', [id_event]);
        const [registrations] = await db.query('SELECT COUNT(*) AS count FROM registrations WHERE id_event = ?', [id_event]);
        if (registrations[0].count >= event[0].max_participants) {
            return res.status(400).json({ message: 'Le nombre maximum de participants a été atteint.' });
        }

        await db.execute('INSERT INTO registrations (id_user, id_event, registered_at) VALUES (?, ?, NOW())', [id_user, id_event]);
        res.status(201).json({ message: 'Inscription réussie.' });
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
    }
});

app.delete('/events/:id', async (req, res) => {
    const eventId = req.params.id;
    const { userId } = req.body; 

    try {
        const [rows] = await db.execute('SELECT * FROM events WHERE id_event = ? AND created_by = ?', [eventId, userId]);
        
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cet événement.' });
        }

        await db.execute('DELETE FROM events WHERE id_event = ?', [eventId]);
        res.status(200).json({ message: 'Événement supprimé avec succès.' });
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement.' });
    }
});

app.put('/events/:id', async (req, res) => {
    const eventId = req.params.id; 
    const { event_name, description, location, date_event, max_participants, userId } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM events WHERE id_event = ? AND created_by = ?', [eventId, userId]);

        if (rows.length === 0) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cet événement.' });
        }

        const query = `
            UPDATE events 
            SET event_name = ?, description = ?, location = ?, date_event = ?, max_participants = ?
            WHERE id_event = ?
        `;
        await db.execute(query, [event_name, description, location, date_event, max_participants, eventId]);

        const [updatedEvent] = await db.query('SELECT * FROM events WHERE id_event = ?', [eventId]);
        res.status(200).json(updatedEvent[0]);
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la modification de l\'événement.' });
    }
});

// Route pour récupérer les participants et les annonces d'un événement
app.get('/event/:id/participants', async (req, res) => {
    const { id } = req.params;
    const eventId = parseInt(id, 10); // 🔹 S'assurer que c'est un nombre

    console.log(`🔍 Requête pour récupérer les détails de l'événement ID: ${eventId}`);

    if (isNaN(eventId)) {
        console.error("❌ ID de l'événement invalide.");
        return res.status(400).json({ message: "ID d'événement invalide." });
    }

    try {
        // 🔹 Vérifier si l'événement existe
        const [event] = await db.query("SELECT * FROM events WHERE id_event = ?", [eventId]);

        if (event.length === 0) {
            console.warn(`⚠️ Aucun événement trouvé pour ID: ${eventId}`);
            return res.status(404).json({ message: "Événement non trouvé." });
        }

        console.log(`✅ Événement trouvé: ${event[0].event_name}`);

        // 🔹 Récupérer les participants de l'événement
        const [participants] = await db.query(`
            SELECT users.id_user, users.username 
            FROM registrations
            JOIN users ON registrations.id_user = users.id_user
            WHERE registrations.id_event = ?
        `, [eventId]);

        console.log(`👥 Participants récupérés (${participants.length})`);

        // 🔹 Vérifier si la table `announcements` existe avant de l'utiliser
        let announcements = [];
        try {
            const [tableCheck] = await db.query(`
                SELECT COUNT(*) AS table_exists 
                FROM information_schema.tables 
                WHERE table_name = 'announcements' AND table_schema = DATABASE();
            `);

            if (tableCheck[0].table_exists > 0) {
                [announcements] = await db.query(`
                    SELECT announcements.message, users.username 
                    FROM announcements
                    JOIN users ON announcements.user_id = users.id_user
                    WHERE announcements.event_id = ?
                `, [eventId]);

                console.log(`📢 Annonces récupérées (${announcements.length})`);
            } else {
                console.warn("⚠️ La table `announcements` n'existe pas.");
            }
        } catch (error) {
            console.warn("⚠️ Erreur lors de la vérification de la table `announcements` :", error);
        }

        res.json({ event: event[0], participants, announcements });
    } catch (err) {
        console.error("❌ Erreur SQL :", err);
        res.status(500).json({ message: "Erreur lors de la récupération des participants." });
    }
});

app.post('/event/:id/announce', async (req, res) => {
    const { id } = req.params;
    const { userId, message } = req.body;


    // Vérifier si l'ID de l'événement est valide
    if (!userId || !message.trim()) {
        return res.status(400).json({ message: "Message vide ou utilisateur invalide." });
    }

    try {
        const [event] = await db.query("SELECT created_by FROM events WHERE id_event = ?", [id]);
        if (event.length === 0) {
            console.warn(` Événement ID ${id} introuvable.`);
            return res.status(404).json({ message: "Événement non trouvé." });
        }

        if (event[0].created_by !== userId) {
            console.warn(` Accès refusé : l'utilisateur ID ${userId} n'est pas l'organisateur.`);
            return res.status(403).json({ message: "Seul l'organisateur peut poster une annonce." });
        }

        await db.execute(`
            CREATE TABLE IF NOT EXISTS announcements (
                id_announcement INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id_event) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
            )
        `);

        await db.execute("INSERT INTO announcements (event_id, user_id, message) VALUES (?, ?, ?)", [id, userId, message]);

        res.status(201).json({ message, username: "Vous" });

    } catch (err) {
        console.error("❌ Erreur SQL :", err);
        res.status(500).json({ message: "Erreur lors de la publication de l'annonce." });
    }
});


    

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
