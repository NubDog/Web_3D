import './TitleBanner.css';
import React from 'react';

interface TitleBannerProps {
    title: string;
}

const TitleBanner = ({title}: TitleBannerProps) => {
    return (
        <div className="TitleBanner-container header-line">
            {title}
        </div>
    )
}

export default TitleBanner;