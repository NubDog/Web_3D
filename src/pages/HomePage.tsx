import React from 'react';
import './../styles/HomePage/HomePage.css';
import '../index.css'
import './../components/Logo/logo.tsx'

// import các components ở đây
import Header from './../components/Header/header.tsx'

const HomePage = () => {
    return (
        <div className="home-page">
            <Header />
        </div>
    )
}

export default HomePage;