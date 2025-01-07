import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home'; 
import CreateEvent from './pages/CreateEvent';
import Register from './pages/Register';
import Login from './pages/Login';
import Events from './pages/Events';
import EditEvent from './components/EditEvent';

const App = () => {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/events" element={<Events />} />
                <Route path="/create-event" element={<CreateEvent />} />
                <Route path="/edit-event/:id" element={<EditEvent />} />
            </Routes>
        </Router>
    );
};

export default App;
