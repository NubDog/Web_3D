import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/Footer';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import FeatureCard from '../../components/Card/FeatureCard';
import '../../styles/pages/StoreHelicopter/StoreHelicopter.css';

interface Hypercar {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    danh_muc_id: number;
}

const StoreHelicopter: React.FC = () => {
    const [vehicles, setVehicles] = useState<Hypercar[]>([]);
    const [loading, setLoading] = useState(true);

    const featureCards = [
        {
            icon: "fa-solid fa-credit-card",
            title: "Thanh toán dễ dàng.",
            description: "Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng."
        },
        {
            icon: "fa-brands fa-telegram",
            title: "Bảo hiểm toàn diện.",
            description: "Gói bảo hiểm cao cấp bảo vệ bạn trên mọi hành trình."
        },
        {
            icon: "fa-brands fa-accusoft",
            title: "Sẵn sàng cất cánh.",
            description: "Thủ tục bay nhanh chóng, hỗ trợ xin phép bay."
        },
        {
            icon: "fa-brands fa-aws",
            title: "Hỗ trợ 24/7.",
            description: "Đội ngũ kỹ thuật hỗ trợ mọi lúc mọi nơi."
        },
        {
            icon: "fa-brands fa-battle-net",
            title: "An toàn tuyệt đối.",
            description: "Bảo trì định kỳ chuẩn quốc tế."
        },
        {
            icon: "fa-brands fa-bity",
            title: "Đa dạng mẫu mã.",
            description: "Nhiều dòng trực thăng từ dân dụng đến cao cấp."
        },
        {
            icon: "fa-brands fa-bitcoin",
            title: "Giá thuê tốt nhất.",
            description: "Cam kết giá cạnh tranh nhất thị trường."
        },
        {
            icon: "fa-solid fa-calendar-check",
            title: "Đặt lịch linh hoạt.",
            description: "Đáp ứng mọi nhu cầu di chuyển khẩn cấp."
        }
    ];

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                // 1. Fetch categories to find Helicopter ID
                const catResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien');
                const catResult = await catResponse.json();

                let catId = '4'; // Default fallback

                if (catResult.success && Array.isArray(catResult.data)) {
                    // Search for "truc thang" or "helicopter"
                    const category = catResult.data.find((c: any) => {
                        const name = c.ten_danh_muc.toLowerCase();
                        return name.includes('trực thăng') || name.includes('truc thang') || name.includes('helicopter');
                    });

                    if (category) {
                        catId = category.danh_muc_id.toString();
                    }
                }

                // 2. Fetch vehicles with found ID
                const params = new URLSearchParams({
                    danh_muc_id: catId,
                    trang_thai: 'SAN_SANG',
                    fields: 'gia_thue,img,loai,ten_phuong_tien,phuong_tien_id,danh_muc_id'
                });
                const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/phuong-tien?${params.toString()}`);
                const result = await response.json();

                console.log("Full Helicopter API Response:", result);

                if (result.success && Array.isArray(result.data)) {
                    setVehicles(result.data);
                }
            } catch (error) {
                console.error('Error fetching helicopters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    return (
        <div className="StoreHelicopter-container">
            <Header />
            <div className="StoreHelicopter-content">
                <div className="StoreHelicopter-header">
                    <h1 className="StoreHelicopter-title">Trực Thăng</h1>
                    <p className="StoreHelicopter-subtitle">Chinh phục bầu trời với những dòng trực thăng hiện đại nhất.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="StoreHelicopter-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.loai}
                                imageUrl={item.img}
                                price={item.gia_thue}
                                status={item.trang_thai}
                                description={`Trải nghiệm đỉnh cao cùng ${item.loai}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feature Section */}
            <div className="StoreHelicopter-feature-section">
                <div className="StoreHelicopter-feature-header">
                    <h2 className="StoreHelicopter-feature-title">Dịch vụ hàng không chuẩn mực</h2>
                </div>

                <div className="StoreHelicopter-feature-scroll-container">
                    <div className="StoreHelicopter-feature-scroll-box">
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
            </div>

            <Footer />
        </div>
    );
};

export default StoreHelicopter;
