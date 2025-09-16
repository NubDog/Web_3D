import React from 'react';
import '../../styles/Card/Card.css';
import Lamborghini_model_Sian from './../../assets/Lamborghini Sian FKP 37.png';

const Card = () => {
    return (
        <div className="Card-container">
            <div className="Card-title">
                <span>Thế hệ mới nhất.</span>
                Xem ngay có gì mới.
            </div>

            <div className="Card-content">
                <div className="Card-content-title">
                    <img src={Lamborghini_model_Sian} alt="Card-content-title-image" />
                    <p className="Card-content-title-text">Thuê ngay</p>
                    <h3 className="Card-content-title-header">Lamborghini Lamborghini Sian FKP 37</h3>
                    <p className="Card-content-title-subtitle">Siêu sang đỉnh cao</p>
                    <p className="Card-content-title-price">Từ 100000000 VNĐ/ngày</p>
                </div>
            </div>
        </div>
    )
}

export default Card;