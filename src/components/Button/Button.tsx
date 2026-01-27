import React from 'react';
import './Button.css';

const Button = ({
    conttent,
    onClick,
    backgroundColor,
    textColor,
    style,
    className,
    arrowStyle
}: {
    conttent: string,
    onClick?: () => void,
    backgroundColor?: string,
    textColor?: string,
    style?: React.CSSProperties,
    className?: string,
    arrowStyle?: React.CSSProperties
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
                <div className="arrow" style={arrowStyle}></div>
            </div>
        </button>
    )
}
export default Button;