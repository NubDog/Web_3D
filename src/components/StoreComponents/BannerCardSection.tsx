import React from 'react';
import './../../styles/components/StoreComponents/BannerCardSection.css'

interface BannerCardSectionProps {
    img: string;
    title: string;
    subtitle: string;
    link: string;
}

const BannerCardSection = ({img, title, subtitle, link}:BannerCardSectionProps) => {
    return (
        <div className="BannerCardSection-container animation-zoom">

            <div className="BannerCardSection-link main-link">
                <a href="#">
                    <img src={img} alt="" className="BannerCardSection-img"/>
                </a>
            </div>

            <div className="BannerCardSection-content">
                <div className="BannerCardSection-title BannerCardSection-width-480">
                    {title}
                </div>

                <div className="BannerCardSection-subtitle BannerCardSection-width-480">
                    {subtitle}
                </div>

                <div className="BannerCardSection-link BannerCardSection-width-480">
                    <a href="#">{link}</a>
                </div>
            </div>

        </div>
    )
}

export default BannerCardSection;