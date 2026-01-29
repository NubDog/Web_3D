import React from 'react';
import BaseCard from './BaseCard';
import expert_img from './../../assets/Expert.jpg';
import expert_img_2 from './../../assets/store-card-50-genius-202108.png';
import './../../styles/components/Card/Card.css';
import type { DataItem } from './BaseCard.tsx';

const supportData: DataItem[] = [
    {
        id: 1,
        img: expert_img,
        product_name: "CHUYÊN gia SHARK EAT RICE",
        product_category: "Thuê đa phương tiện với tư vấn trực tiếp từ Chuyên gia",
        product_price: null,
    },

    {
        id: 2,
        img: expert_img_2,
        product_name: "CHUYÊN GIA SHARK EAT RICE",
        product_category: "Dịch vụ và hỗ trợ. Chúng tôi luôn sẵn sàng",
        product_price: null,
    }
]

const SupportCard = () => {
    return (
        <div className="Card-container">
            <div className="Card-title-container col-1617">
                <h2 className="Card-title">Chuyên gia <span>Shark Eat Rice</span></h2>
            </div>

            <div className="Card-box">
                <div className="Card-scroll-buttons">
                    <button className='non-active'>
                        <i className="icon-scroll fa-solid fa-angle-left"></i>
                    </button>
                    <button className='non-active'>
                        <i className="icon-scroll fa-solid fa-angle-right"></i>
                    </button>
                </div>
                {supportData.map((item) => (
                    <div className="Card-content"
                        key={item.id}
                        style={{
                            width: '480px',
                            height: '500px',
                            backgroundImage: 'linear-gradient(to left top, #ffffff, #fefdff, #fefcff, #fefaff, #fef8ff, #f6eaf9, #eddcf4, #e3ceef, #c7b3e6, #a49bdf, #7786d9, #2c73d2)',
                        }}
                    >
                        <div className="Card-content-title-link">
                            <a href="#">
                                <img
                                    style={{
                                        objectFit: 'cover',
                                        borderRadius: '28px',
                                        marginTop: 0,
                                    }}
                                    src={item.img || expert_img_2}
                                    alt={item.product_name}
                                    onError={(e) => {
                                        e.currentTarget.src = expert_img_2;
                                    }}
                                />
                            </a>
                        </div>
                        <div className="Card-content-title">
                            <h3
                                className="Card-content-title-header text-font-14"
                                style={{
                                    zIndex: 1,
                                }}
                            >
                                {item.product_name}
                            </h3>
                            <p
                                className="Card-content-title-subtitle"
                                style={{
                                    width: '50%',
                                    lineHeight: '1.2',
                                    fontSize: '18px',
                                    color: 'var(--white)',
                                }}
                            >

                                {item.product_category}
                            </p>
                            <p className="Card-content-title-price">
                                {item.product_price ? item.product_price.toLocaleString('vi-VN') + ' VNĐ/ngày' : null}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SupportCard;