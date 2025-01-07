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
    password: '20122004',
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
        res.status(200).json(user); // Vérifiez que l'objet retourné contient id_user
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la connexion.' });
    }
});

app.post('/events', async (req, res) => {
    console.log('Données reçues dans la requête POST :', req.body); // Log pour vérifier les données

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
        console.log('Résultats SQL :', rows);
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
        // Vérifiez si l'utilisateur est déjà inscrit à cet événement
        const [existing] = await db.query('SELECT * FROM registrations WHERE id_event = ? AND id_user = ?', [id_event, id_user]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement.' });
        }

        // Vérifiez le nombre maximum de participants
        const [event] = await db.query('SELECT max_participants FROM events WHERE id_event = ?', [id_event]);
        const [registrations] = await db.query('SELECT COUNT(*) AS count FROM registrations WHERE id_event = ?', [id_event]);
        if (registrations[0].count >= event[0].max_participants) {
            return res.status(400).json({ message: 'Le nombre maximum de participants a été atteint.' });
        }

        // Inscrire l'utilisateur
        await db.execute('INSERT INTO registrations (id_user, id_event, registered_at) VALUES (?, ?, NOW())', [id_user, id_event]);
        res.status(201).json({ message: 'Inscription réussie.' });
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
    }
});

app.delete('/events/:id', async (req, res) => {
    const eventId = req.params.id;
    const { userId } = req.body; // ID de l'organisateur connecté

    try {
        // Vérifiez si l'utilisateur est bien le créateur de l'événement
        const [rows] = await db.execute('SELECT * FROM events WHERE id_event = ? AND created_by = ?', [eventId, userId]);
        
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cet événement.' });
        }

        // Supprimer l'événement
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
        res.status(200).json(updatedEvent[0]); // Retourne l'événement mis à jour
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ message: 'Erreur lors de la modification de l\'événement.' });
    }
});



    

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
