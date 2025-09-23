import React from 'react';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import './../styles/pages/Car/Car.css';

const Car = () => {
    return (
        <div className="car-container">
            <Header />
            <div className="car-container">
                <h1>Car</h1>
            </div>
            <Footer />
        </div>
    )
}

export default Car;