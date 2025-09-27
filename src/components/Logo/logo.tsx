import React from 'react';
import './logo.css';
import { Navigate } from 'react-router-dom';

const Logo = () => {
    return (
        <div className= "main-logo">
            <a href = "/">
                <img src = "../../../public/logo.svg" className= "main-logo"></img>
            </a>
        </div>
    )
}

export default Logo;