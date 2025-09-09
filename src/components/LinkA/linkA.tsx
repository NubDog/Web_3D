import React from 'react';
import './linkA.css';

const LinkA = ({content_link}: {content_link: string}) => {
    return (
        <a href="#" className="linkA">{content_link}</a>
    )
}

export default LinkA;