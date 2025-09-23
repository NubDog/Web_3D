import React, { useState } from 'react';
import './input.css';

const Input = ({placeholder, value, onChange}: {placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) => {
    return (
        <div className="input-container">
            <input
                type="text" 
                id="input" required
                value={value}
                onChange={onChange}
            />
            <label htmlFor="input" className="label">{placeholder}</label>
            <div className="underline"></div>
        </div>
    )
};

export default Input;