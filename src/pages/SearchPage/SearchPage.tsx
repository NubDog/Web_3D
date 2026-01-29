import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header/header';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import '../../styles/pages/SearchPage/SearchPage.css';

interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    bien_so: string;
    // Add other fields if needed, but these are core for the card
}

interface ApiResponse {
    success: boolean;
    data: PhuongTien[];
}

const SearchPage: React.FC = () => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<PhuongTien[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (location.state && location.state.query) {
            setSearchQuery(location.state.query);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchQuery.trim()) {
                setProducts([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/phuong-tien?search=${encodeURIComponent(searchQuery)}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const result: ApiResponse = await response.json();

                if (result.success) {
                    setProducts(result.data);
                } else {
                    setProducts([]); // Or handle specific API error messages
                }
            } catch (err) {
                console.error("Error fetching search results:", err);
                setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSearchResults();
        }, 300); // Debounce slightly to avoid rapid calls if typing updates query (though currently it's on navigation)

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <div className="searchpage-wrapper">
            <Header />
            <div className="searchpage-main">
                <div className="searchpage-container">
                    <div className="searchpage-header">
                        <h2 className="searchpage-title">
                            {loading
                                ? 'Đang tìm kiếm...'
                                : `Kết quả tìm kiếm ${searchQuery ? `cho "${searchQuery}"` : ''}`
                            }
                        </h2>
                        <div className="searchpage-filter-icon">
                            <i className="fa-solid fa-filter"></i>
                        </div>
                    </div>

                    {error && <div style={{ color: 'red', textAlign: 'center', margin: '20px 0' }}>{error}</div>}

                    {!loading && !error && products.length === 0 && searchQuery && (
                        <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '40px', fontSize: '18px' }}>
                            Không tìm thấy kết quả nào.
                        </div>
                    )}

                    <div className="searchpage-grid">
                        {products.map((car) => (
                            <HypercarCard2
                                key={car.phuong_tien_id}
                                id={car.phuong_tien_id}
                                name={car.ten_phuong_tien}
                                imageUrl={car.img || 'https://via.placeholder.com/400x250?text=No+Image'} // Fallback image
                                price={car.gia_thue}
                                status={car.trang_thai}
                                description={`Biển số: ${car.bien_so} - Một lựa chọn tuyệt vời trong phân khúc.`} // Generic description since API lacks it
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
