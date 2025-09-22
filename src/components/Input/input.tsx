import React from 'react';
import './input.css';

const Input = () => {
    return (
        <div className="input-container">
            <input type="text" id="input" required />
            <label htmlFor="input" className="label">Enter Text</label>
            <div className="underline"></div>
        </div>
    )
};

export default Input;