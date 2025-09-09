import React from 'react';
import './Button.css';

const Button = ({ conttent }: { conttent: string }) => {
    return (
        <button className="main-button">
            {conttent}
            <div className="arrow-wrapper">
                <div className="arrow"></div>   
            </div>
        </button>
    )
}

export default Button;