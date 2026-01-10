import React, { useState, useEffect } from 'react';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import HypercarCard2 from '../components/Card/HypercarCard2.0';
import FeatureCard from '../components/Card/FeatureCard';
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

    const featureCards = [
        {
            icon: "fa-solid fa-credit-card",
            title: "Thanh toán dễ dàng.",
            description: "Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng."
        },
        {
            icon: "fa-solid fa-shield-halved",
            title: "Bảo hiểm toàn diện.",
            description: "Gói bảo hiểm cao cấp bảo vệ bạn trên mọi hành trình."
        },
        {
            icon: "fa-solid fa-truck-fast",
            title: "Giao xe tận nơi.",
            description: "Miễn phí giao nhận xe trong nội thành TP.HCM."
        },
        {
            icon: "fa-solid fa-headset",
            title: "Hỗ trợ 24/7.",
            description: "Đội ngũ kỹ thuật hỗ trợ mọi lúc mọi nơi."
        },
        {
            icon: "fa-solid fa-user-shield",
            title: "Bảo mật tuyệt đối.",
            description: "Thông tin khách hàng được bảo mật 100%."
        },
        {
            icon: "fa-solid fa-car-side",
            title: "Đa dạng dòng xe.",
            description: "Hơn 50 mẫu siêu xe từ các thương hiệu hàng đầu."
        },
        {
            icon: "fa-solid fa-hand-holding-dollar",
            title: "Giá thuê tốt nhất.",
            description: "Cam kết giá cạnh tranh nhất thị trường."
        },
        {
            icon: "fa-solid fa-calendar-check",
            title: "Thủ tục nhanh gọn.",
            description: "Nhận xe chỉ sau 15 phút làm thủ tục."
        }
    ];

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
        <div className="StoreHypercar-container">
            <Header />
            <div className="StoreHypercar-content">
                <div className="StoreHypercar-header">
                    <h1 className="StoreHypercar-title">Siêu xe Hypercar</h1>
                    <p className="StoreHypercar-subtitle">Khám phá bộ sưu tập những siêu xe đẳng cấp thế giới.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="StoreHypercar-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.loai}
                                imageUrl={item.img}
                                price={item.gia_thue}
                                status={item.trang_thai}
                                description={`Trải nghiệm đẳng cấp cùng ${item.loai}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feature Section */}
            <div className="StoreHypercar-feature-section">
                <div className="StoreHypercar-feature-header">
                    <h2 className="StoreHypercar-feature-title">Vì sao chọn chúng tôi?</h2>
                </div>
                <div className="StoreHypercar-feature-grid">
                    {featureCards.map((card, index) => (
                        <FeatureCard
                            key={index}
                            iconName={card.icon}
                            title={card.title}
                            description={card.description}
                        />
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default StoreHypercar;
