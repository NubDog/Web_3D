import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header/header';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import '../../styles/pages/SearchPage/SearchPage.css';

// Dữ liệu giả để hiển thị giao diện
const DUMMY_CARS = Array.from({ length: 8 }).map((_, index) => ({
    id: index + 1,
    name: `Hypercar Alpha ${index + 1}`,
    imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc411c82b148?q=80&w=2070&auto=format&fit=crop',
    price: 5000000 * (index + 1),
    status: 'SAN_SANG',
    description: 'Trải nghiệm đỉnh cao tốc độ và sự sang trọng tuyệt đối.'
}));

const SearchPage: React.FC = () => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (location.state && location.state.query) {
            setSearchQuery(location.state.query);
        }
    }, [location.state]);

    return (
        <div className="searchpage-wrapper">
            <Header />
            <div className="searchpage-main">
                <div className="searchpage-container">
                    <div className="searchpage-header">
                        <h2 className="searchpage-title">
                            Kết quả tìm kiếm {searchQuery && `cho "${searchQuery}"`}
                        </h2>
                        <div className="searchpage-filter-icon">
                            <i className="fa-solid fa-filter"></i>
                        </div>
                    </div>

                    <div className="searchpage-grid">
                        {DUMMY_CARS.map((car) => (
                            <HypercarCard2
                                key={car.id}
                                id={car.id}
                                name={car.name}
                                imageUrl={car.imageUrl}
                                price={car.price}
                                status={car.status}
                                description={car.description}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
