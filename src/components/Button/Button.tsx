import React from 'react';
import './Button.css';

const Button = ({ conttent, onClick }: { conttent: string, onClick?: () => void }) => {
    return (
        <button className="main-button" onClick={onClick}>
            {conttent}
            <div className="arrow-wrapper">
                <div className="arrow"></div>
            </div>
        </button>
    )
}

export default Button;