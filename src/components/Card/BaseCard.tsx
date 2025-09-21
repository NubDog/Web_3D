import { useState, useEffect, useRef } from 'react';

import './../../styles/components/Card/Card.css';
import Lamborghini_model_Sian from './../../assets/Lamborghini Sian FKP 37.png';

export interface DataItem {
    id: number;
    img?: string;
    product_name: string;
    product_category: string;
    product_price?: number | null;
}

interface CardProps {
    card_title: string;
    card_subtitle: string;
    data: DataItem[];
    Card_content_customMiddle:string;
}


const BaseCard = ({card_title, card_subtitle, data, Card_content_customMiddle}: CardProps) => {
    const cardBoxRef = useRef<HTMLDivElement>(null);
    const [clickCount, setClickCount] = useState(0);
    const numberCard = data?.length ?? 0;

    const scrollLeft = () => {
        if (cardBoxRef.current) {
            const element = cardBoxRef.current;
            console.log('Current scroll left:', element.scrollLeft);
            console.log('Scroll width:', element.scrollWidth);
            console.log('Client width:', element.clientWidth);
            console.log('Can scroll left:', element.scrollLeft > 0);
            
            element.scrollBy({ left: -420, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (cardBoxRef.current) {
            const element = cardBoxRef.current;
            console.log('Current scroll left:', element.scrollLeft);
            console.log('Scroll width:', element.scrollWidth);
            console.log('Client width:', element.clientWidth);
            console.log('Can scroll right:', element.scrollLeft < element.scrollWidth - element.clientWidth);
            
            element.scrollBy({ left: 420, behavior: 'smooth' });
        }
    };

    const handleScrollLeft = () => {
        scrollLeft();
        setClickCount(prevCount => prevCount - 1);
    };

    const handleScrollRight = () => {
        scrollRight();
        setClickCount(prevCount => prevCount + 1);
    };

    // console.log('Số lần bấm nút cuộn:', clickCount);


    
    return (
        <div className="Card-container">
            <div className="Card-title-container col-1617">
                <h2 className="Card-title">{card_title}<span>{card_subtitle}</span></h2>
            </div>
            
            <div className="Card-box" ref={cardBoxRef}>
                <div className="Card-scroll-buttons">
                    <button className={clickCount === 0 ? 'non-active' : 'active'} onClick={handleScrollLeft} aria-label="Scroll Left">
                        <i className="icon-scroll fa-solid fa-angle-left"></i>
                    </button>
                    <button className={numberCard < 4 || clickCount >= 6 ? 'non-active' : 'active'} onClick={handleScrollRight} aria-label="Scroll Right">
                        <i className="icon-scroll fa-solid fa-angle-right"></i>
                    </button>
                </div>
                {data.map((item) => (
                    <div className={`Card-content ${Card_content_customMiddle ?? ''}`} key={item.id}>
                        <div className="Card-content-title-link">
                            <a href="#">
                                <img 
                                    src={item.img || Lamborghini_model_Sian}
                                    alt={item.product_name}
                                    onError={(e) => {
                                        e.currentTarget.src = Lamborghini_model_Sian;
                                    }}
                                />
                            </a>
                        </div>
                        <div className="Card-content-title">
                            <h3 className="Card-content-title-header">{item.product_name}</h3>
                            <p className="Card-content-title-subtitle">{item.product_category}</p>
                            <p className="Card-content-title-price">
                                {item.product_price ? item.product_price.toLocaleString('vi-VN') + ' VNĐ/ngày' : null}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BaseCard;