import React from 'react';
import './Button.css';

const Button = ({
    conttent,
    onClick,
    backgroundColor,
    textColor
}: {
    conttent: string,
    onClick?: () => void,
    backgroundColor?: string,
    textColor?: string
}) => {
    return (
        <button
            className="main-button"
            onClick={onClick}
            style={{
                backgroundColor: backgroundColor,
                color: textColor
            }}
        >
            {conttent}
            <div className="arrow-wrapper">
                <div className="arrow"></div>
            </div>
        </button>
    )
}

export default Button;