import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import xss from 'xss';

dotenv.config();


const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;



app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
console.log('Connecté à la base de données.');

// POST REGISTER
app.post('/register', async (req, res) => {
    const { username, email, password, userType } = req.body;

    if (!username || !email || !password || !userType) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password, user_type) VALUES (?, ?, ?, ?)';
        await db.execute(query, [username, email, hashedPassword, userType]);
        res.status(201).json({ message: 'Utilisateur inscrit avec succès.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Cet utilisateur ou cet email existe déjà.' });
        } else {
            console.error(err);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    }
});

// POST LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        const query = 'SELECT id_user, username, email, user_type, password FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const user = rows[0];
        // Compare password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Remove password before sending user object
        delete user.password;

        // Generate JWT
        const token = jwt.sign(
            { id_user: user.id_user, username: user.username, user_type: user.user_type },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({ user, token }); // Send token to frontend
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la connexion.' });
    }
});

// JWT authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token manquant.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token invalide.' });
        req.user = user;
        next();
    });
}

app.get('/history/:id_user', authenticateToken, async (req, res) => {
    const { id_user } = req.params;

    if (!id_user) {
        return res.status(400).json({ message: "ID utilisateur manquant." });
    }

    try {
        const [userExists] = await db.query(`SELECT id_user FROM users WHERE id_user = ?`, [id_user]);

        if (userExists.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const [createdEvents] = await db.query(`
            SELECT events.*, 
                (SELECT COUNT(*) FROM registrations WHERE registrations.id_event = events.id_event) AS current_participants
            FROM events 
            WHERE created_by = ?
        `, [id_user]);

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


app.post('/events', csrf({ cookie: true }), async (req, res) => {
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

        await db.execute(query, [
            event_name.trim(),
            description?.trim() || '',
            location.trim(),
            date_event,
            max_participants,
            created_by
        ]);

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

app.post('/registrations', csrf({ cookie: true }), async (req, res) => {
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

app.delete('/events/:id', csrf({ cookie: true }), async (req, res) => {
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

app.put('/events/:id', csrf({ cookie: true }), async (req, res) => {
    const eventId = req.params.id; 
    const { event_name, description, location, date_event, max_participants, userId } = req.body;

    if (!event_name || !location || !date_event || !userId || max_participants < 1) {
        return res.status(400).json({ message: 'Tous les champs requis ne sont pas remplis.' });
    }

 
    

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
        await db.execute(query, [cleanEventName, cleanDescription, cleanLocation, date_event, max_participants, eventId]);

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
    const eventId = parseInt(id, 10); 

    console.log(`Requête pour récupérer les détails de l'événement ID: ${eventId}`);

    if (isNaN(eventId)) {
        console.error("ID de l'événement invalide.");
        return res.status(400).json({ message: "ID d'événement invalide." });
    }

    try {
        const [event] = await db.query("SELECT * FROM events WHERE id_event = ?", [eventId]);

        if (event.length === 0) {
            console.warn(` Aucun événement trouvé pour ID: ${eventId}`);
            return res.status(404).json({ message: "Événement non trouvé." });
        }

        console.log(`Événement trouvé: ${event[0].event_name}`);

        const [participants] = await db.query(`
            SELECT users.id_user, users.username 
            FROM registrations
            JOIN users ON registrations.id_user = users.id_user
            WHERE registrations.id_event = ?
        `, [eventId]);

        console.log(`👥 Participants récupérés (${participants.length})`);

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

                console.log(`Annonces récupérées (${announcements.length})`);
            } else {
                console.warn("La table `announcements` n'existe pas.");
            }
        } catch (error) {
            console.warn("Erreur lors de la vérification de la table `announcements` :", error);
        }

        res.json({ event: event[0], participants, announcements });
    } catch (err) {
        console.error("Erreur SQL :", err);
        res.status(500).json({ message: "Erreur lors de la récupération des participants." });
    }
});

app.post('/event/:id/announce', csrf({ cookie: true }), async (req, res) => {
    const { id } = req.params;
    const { userId, message } = req.body;
    const cleanMessage = xss(message);

    if (!userId || !message.trim()) {
        return res.status(400).json({ message: "Message vide ou utilisateur invalide." });
    }

    try {
        const [event] = await db.query("SELECT created_by FROM events WHERE id_event = ?", [id]);
        if (event.length === 0) {
            console.warn(`Événement ID ${id} introuvable.`);
            return res.status(404).json({ message: "Événement non trouvé." });
        }

        if (event[0].created_by !== userId) {
            console.warn(`Accès refusé : l'utilisateur ID ${userId} n'est pas l'organisateur.`);
            return res.status(403).json({ message: "Seul l'organisateur peut poster une annonce." });
        }

        const cleanMessage = xss(message);

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

        await db.execute("INSERT INTO announcements (event_id, user_id, message) VALUES (?, ?, ?)", [id, userId, cleanMessage]);

        res.status(201).json({ message: cleanMessage, username: "Vous" });

    } catch (err) {
        console.error("Erreur SQL :", err);
        res.status(500).json({ message: "Erreur lors de la publication de l'annonce." });
    }
});


app.get('/csrf-token', csrf({ cookie: true }), (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
