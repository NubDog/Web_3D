import React, { useState, useEffect } from 'react';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import HypercarCard2 from '../components/Card/HypercarCard2.0';
import '../styles/pages/StoreHypercar/StoreHypercar.css';

interface Hypercar {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    danh_muc_id: number;
}

const StoreHypercar: React.FC = () => {
    const [vehicles, setVehicles] = useState<Hypercar[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHypercars = async () => {
            try {
                const params = new URLSearchParams({
                    danh_muc_id: '2',
                    trang_thai: 'SAN_SANG',
                    fields: 'gia_thue,img,loai,ten_phuong_tien,phuong_tien_id,danh_muc_id'
                });
                const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/phuong-tien?${params.toString()}`);
                const result = await response.json();

                console.log("Full Hypercar API Response:", result);

                if (result.success && Array.isArray(result.data)) {
                    setVehicles(result.data);
                }
            } catch (error) {
                console.error('Error fetching hypercars:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHypercars();
    }, []);

    return (
        <div className="store-hypercar-container">
            <Header />
            <div className="store-hypercar-content">
                <div className="store-header">
                    <h1 className="store-title">Siêu xe Hypercar</h1>
                    <p className="store-subtitle">Khám phá bộ sưu tập những siêu xe đẳng cấp thế giới.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="hypercar-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.loai} // Mapping 'loai' to name as requested
                                imageUrl={item.img}
                                price={item.gia_thue}
                                status={item.trang_thai}
                                description={`Trải nghiệm đẳng cấp cùng ${item.loai}`}
                            />
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default StoreHypercar;
