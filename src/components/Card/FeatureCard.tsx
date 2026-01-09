import React from 'react';
import '../../styles/components/Card/FeatureCard.css';

interface FeatureCardProps {
    iconName: string;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ iconName, title, description }) => {
    return (
        <div className="feature-card">
            <div className="feature-icon-wrapper">
                <div className="feature-icon">
                    <i className={iconName}></i>
                </div>
            </div>

            <div className="feature-content">
                <h3 className="feature-title">{title}</h3>
                <p className="feature-description">{description}</p>
            </div>

            <div className="feature-plus-btn">
                <i className="fa-solid fa-plus"></i>
            </div>
        </div>
    );
};

export default FeatureCard;
