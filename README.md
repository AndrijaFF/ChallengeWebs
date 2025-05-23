﻿# ChallengeWebs
# Eventude

## Description
Eventude est une plateforme web permettant aux utilisateurs de créer, gérer et s'inscrire à des événements. Elle propose également un espace personnel pour consulter l'historique des événements créés et ceux auxquels l'utilisateur a participé.

## Fonctionnalités
- 🔐 **Authentification et gestion des utilisateurs**
  - Inscription et connexion des utilisateurs
  - Deux types d'utilisateurs : `organisateur` et `participant`
  
- 📅 **Gestion des événements**
  - Création, modification et suppression d'événements (organisateur uniquement)
  - Inscription et désinscription aux événements
  
- 📜 **Historique des événements**
  - Affichage des événements créés (organisateur)
  - Affichage des événements passés et futurs
  
- 📢 **Annonces et gestion des participants**
  - Les organisateurs peuvent publier des annonces sur leurs événements
  - Visualisation des participants d'un événement

## Installation et Exécution
### Prérequis
- [Node.js](https://nodejs.org/) installé
- [MySQL/MariaDB](https://mariadb.org/) pour la base de données
- [Git](https://git-scm.com/) installé

### Installation
```sh
# Cloner le projet
git clone <URL_DU_DEPOT>
cd ChallengeWebs/vite-project

# Installer les dépendances
npm install
```

### Configuration de la base de données
Importer le fichier `database.sql` et mettre à jour `server.js` avec vos identifiants SQL.

### Lancer le serveur back-end
```sh
cd server
node server.js
```

### Lancer le front-end
```sh
npm run dev
```
## API

### Routes disponibles

#### 🔹 Utilisateurs
- `POST /register` → Inscription
- `POST /login` → Connexion

#### 🔹 Événements
- `GET /events` → Liste des événements
- `POST /events` → Création d'un événement
- `PUT /events/:id` → Modification d'un événement
- `DELETE /events/:id` → Suppression d'un événement
- `GET /event/:id/participants` → Participants d'un événement

#### 🔹 Historique
- `GET /history/:id_user` → Historique des événements d'un utilisateur

#### 🔹 Annonces
- `POST /event/:id/announce` → Poster une annonce

## Contribution
🚀 Vous souhaitez contribuer ? Forkez le projet et proposez vos modifications via une Pull Request !

## Auteurs
- **Tomic** - Développeur principal

## Licence
📜 Ce projet est sous licence MIT - Voir le fichier `LICENSE` pour plus d'informations.
