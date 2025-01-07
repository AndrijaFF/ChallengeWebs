import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        onSearch(e.target.value);
    };

    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={handleInputChange}
                className="search-input"
            />
        </div>
    );
};

export default SearchBar;
