import React from 'react';
import GalleryBike from './../../assets/Gallery img/Gallery Bike.png'
import './../../styles/components/StoreBike/CardGallery.css'

interface CardProps {
    card_title: string;
    card_subtitle: string;
    card_img: string;
    card_link: string;
}

const storeBikeGalleryCard = ({card_img, card_link, card_subtitle, card_title}: CardProps) => {
    return (
        <div className="GalleryCard-container">
            <a className="GalleryCard-link" href = {card_link}>
                <img
                    src = {card_img}
                />

            <div className="GalleryCard-title">
                <p>{card_title}</p>
                <h3>{card_subtitle}</h3>
            </div>
            </a>
        </div>
    )
}

export default storeBikeGalleryCard;