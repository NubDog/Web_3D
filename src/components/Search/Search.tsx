import React, { useState } from 'react';
import './../../styles/components/Search/Search.css';

interface SearchProps {
    placeholder?: string;
    onSearch?: (text: string) => void;
}

export const Search: React.FC<SearchProps> = ({
    placeholder = 'Type to search...',
    onSearch
}) => {
    const [searchText, setSearchText] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setSearchText(text);
        if (onSearch) {
            onSearch(text);
        }
    };

    return (
        <div className="search-container">
            <input
                type="text"
                name="text"
                className="search-input"
                value={searchText}
                onChange={handleChange}
                required
                placeholder={placeholder}
            />
            <div className="search-icon">
                <i className="fa-solid fa-magnifying-glass"></i>
            </div>
        </div>
    );
};

export default Search;