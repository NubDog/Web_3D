import react from 'react';
import './Sub-Butoon.css';

const Sub_Button = ({content, onClick}: {content: string, onClick: () => void}) => {
    return (
        <button onClick={onClick} className="Sub-Button">
            <span className="Sub-Button-circle" aria-hidden="true">
            <span className="Sub-Button-icon arrow"></span>
            </span>
            <span className="Sub-Button-text">{content}</span>
        </button>
    )
}

export default Sub_Button;