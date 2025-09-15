import React from 'react';
import './../styles/Store/Store.css';
import Header from './../components/Header/header'
import chat from './../assets/Store chat.jpg'

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

            </div>

        </div>
    )
}

export default Store;