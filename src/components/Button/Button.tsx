import React from 'react';
import './Button.css';

const Button = ({ conttent }: { conttent: string }) => {
    return (
        <button className="learn-more">
        <span className="circle" aria-hidden="true">
        <span className="icon arrow"></span>
        </span>
        <span className="button-text">{conttent}</span>
        </button>
    )
}

export default Button;