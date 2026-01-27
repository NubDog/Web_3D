import React from 'react';
import './Button.css';

const Button = ({
    conttent,
    onClick,
    backgroundColor,
    textColor,
    style,
    className
}: {
    conttent: string,
    onClick?: () => void,
    backgroundColor?: string,
    textColor?: string,
    style?: React.CSSProperties,
    className?: string
}) => {
    return (
        <button
            className={`main-button ${className || ''}`}
            onClick={onClick}
            style={{
                backgroundColor: backgroundColor,
                color: textColor,
                ...style
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