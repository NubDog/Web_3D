import React from 'react';
import './Button-Card-CheckOut.css';

const ButtonCardCheckOut = () => {
    return (
        <div className="CheckOut-Payment-container">
            <div className="CheckOut-Payment-left-side">
                <div className="CheckOut-Payment-card">
                    <div className="CheckOut-Payment-card-line"></div>
                    <div className="CheckOut-Payment-buttons"></div>
                </div>
                <div className="CheckOut-Payment-post">
                    <div className="CheckOut-Payment-post-line"></div>
                    <div className="CheckOut-Payment-screen">
                        <div className="CheckOut-Payment-dollar">$</div>
                    </div>
                    <div className="CheckOut-Payment-numbers"></div>
                    <div className="CheckOut-Payment-numbers-line2"></div>
                </div>
            </div>
            <div className="CheckOut-Payment-right-side">
                <div className="CheckOut-Payment-new">Thanh toán bằng thẻ</div>
                <svg viewBox="0 0 451.846 451.847" height="512" width="512" xmlns="http://www.w3.org/2000/svg" className="CheckOut-Payment-arrow">
                    <path fill="#cfcfcf" data-old_color="#000000" className="active-path" data-original="#000000" d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"></path>
                </svg>
            </div>
        </div>
    );
}

export default ButtonCardCheckOut;