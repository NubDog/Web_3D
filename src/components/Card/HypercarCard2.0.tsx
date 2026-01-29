import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
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
    const navigate = useNavigate();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(value);
    };

    const handleRentClick = () => {
        navigate('/product_detail', { state: { productId: id } });
    };

    return (
        <div className="HypercarCard2-invisible">
            <div className="HypercarCard2-image-wrapper">
                <img
                    src={imageUrl}
                    alt={name}
                    className="HypercarCard2-image"
                    loading="lazy"
                />
            </div>

            <div className="HypercarCard2-content">
                <h3 className="HypercarCard2-title">{name}</h3>

                <p className="HypercarCard2-description">
                    {description || (status === 'SAN_SANG' ? 'Sẵn sàng trải nghiệm' : status)}
                </p>

                <p className="HypercarCard2-price">
                    Từ {formatCurrency(price)}/ngày
                </p>

                <div className="HypercarCard2-actions">
                    <Button
                        conttent="Thuê ngay"
                        onClick={handleRentClick}
                        backgroundColor='#0071e3'
                        textColor='white'
                    />

                    <button
                        className="HypercarCard2-btn-secondary"
                        onClick={() => console.log(`View details ${id}`)}
                    >
                        Tìm hiểu thêm
                        <span className="HypercarCard2-icon-arrow">
                            <i className="fa-solid fa-chevron-right"></i>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HypercarCard2;
