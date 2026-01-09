import React from 'react';
import '../../styles/components/Card/FeatureCard.css';

interface FeatureCardProps {
    iconName: string;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ iconName, title, description }) => {
    return (
        <div className="FeatureCard-container">
            <div className="FeatureCard-icon-wrapper">
                <div className="FeatureCard-icon">
                    <i className={iconName}></i>
                </div>
            </div>

            <div className="FeatureCard-content">
                <h3 className="FeatureCard-title">{title}</h3>
                <p className="FeatureCard-description">{description}</p>
            </div>

            <div className="FeatureCard-plus-btn">
                <i className="fa-solid fa-plus"></i>
            </div>
        </div>
    );
};

export default FeatureCard;
