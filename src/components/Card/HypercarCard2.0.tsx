import React from 'react';
import '../../styles/components/Card/HypercarCard2.0.css';

interface HypercarCardProps {
    id: number | string;
    name: string;
    imageUrl: string;
    price: number;
    status: string;
    description?: string;
}

const HypercarCard2: React.FC<HypercarCardProps> = ({
    id,
    name,
    imageUrl,
    price,
    status,
    description
}) => {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="hypercar-card-invisible">
            {/* Image Section - First as requested */}
            <div className="card-image-wrapper">
                <img
                    src={imageUrl}
                    alt={name}
                    className="card-image"
                    loading="lazy"
                />
            </div>

            {/* Content Section */}
            <div className="card-content">
                <h3 className="card-title">{name}</h3>

                <p className="card-description">
                    {description || (status === 'SAN_SANG' ? 'Sẵn sàng trải nghiệm' : status)}
                </p>

                <p className="card-price">
                    Từ {formatCurrency(price)}/ngày
                </p>

                <div className="card-actions">
                    <button
                        className="btn-primary"
                        onClick={() => console.log(`Rent car ${id}`)}
                    >
                        Thuê xe
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => console.log(`View details ${id}`)}
                    >
                        Tìm hiểu thêm
                        <span className="icon-arrow">
                            <i className="fa-solid fa-chevron-right"></i>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HypercarCard2;
