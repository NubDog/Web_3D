import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setSearchText(text);
        if (onSearch) {
            onSearch(text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigate('/search', { state: { query: searchText } });
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
                onKeyDown={handleKeyDown}
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