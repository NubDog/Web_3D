import React from 'react';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import '../styles/pages/StoreHypercar/StoreHypercar.css';

const StoreHypercar: React.FC = () => {
    React.useEffect(() => {
        const fetchHypercars = async () => {
            try {
                const params = new URLSearchParams({
                    danh_muc_id: '2',
                    trang_thai: 'SAN_SANG',
                    fields: 'gia_thue,img,loai,ten_phuong_tien,phuong_tien_id'
                });
                const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/phuong-tien?${params.toString()}`);
                const data = await response.json();
                console.log('Hypercar Data:', data);
            } catch (error) {
                console.error('Error fetching hypercars:', error);
            }
        };

        fetchHypercars();
    }, []);

    return (
        <div className="store-hypercar-container">
            <Header />
            <div className="store-hypercar-content">
                Hello World
            </div>
            <Footer />
        </div>
    );
};

export default StoreHypercar;
