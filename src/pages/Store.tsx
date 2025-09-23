import React from 'react';
import './../styles/pages/Store/Store.css';
import Header from './../components/Header/header'
import chat from './../assets/Store chat.jpg'
import duThuyen from "./../assets/Du Thuyền.png";
import hypercar from "./../assets/Lamborghini Sian FKP 37.png";
import helicopter from "./../assets/Helicopters isometric.png";
import flycam from "./../assets/Mavic Pro Flycam.png";
import motorbike from "./../assets/Ninja H2R.png";
import suv from "./../assets/Lexus RX 350 Luxury.png";

import CardCar from "../components/Card/CardHypercar"
import CardBike from "../components/Card/CardBike";
import SupportCard from "../components/Card/SupportCard";
import MiniCard from "../components/Card/MiniCard";
import CardFlycam from "../components/Card/CardFlyCam";
import SuvCard from "../components/Card/SuvCard";

import Footer from "../components/Footer/Footer";

const platter = [
    duThuyen,
    hypercar,
    helicopter,
    flycam,
    motorbike,
    suv,
]

const Store = () => {
    return (
        <div className="store">
            <Header />

            <div className="Store-container">
                <div className="Store-title">
                    <div className="Store-title-text">
                        <h2><span>Cửa Hàng. </span>Cách tốt nhất để</h2>
                        <h2>mua sản phẩm bạn thích.</h2>
                    </div>
                    <div className="Store-chat">
                        <img src={chat} alt="chat" />
                        <div className="Store-chat-text">
                            <p>Bạn cần trợ giúp mua sắm?</p>
                            <a>Hỏi chuyên gia <i className="fa-brands fa-telegram"></i></a>
                        </div>
                    </div>
                </div>

                <div className="Store-platter">
                    {platter.map((image, index) => (
                        <div className="Store-platter-item" key={index}>
                            <a href='#'><img src={image} alt={`platter-${index}`} /></a>
                        </div>
                    ))}
                </div>
            </div>

            <CardCar />
            <CardBike />
            <SupportCard />
            <MiniCard />
            <CardFlycam />
            <SuvCard />
            <Footer />
        </div>
    )
}

export default Store;