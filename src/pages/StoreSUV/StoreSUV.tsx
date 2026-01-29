import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/Footer';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import FeatureCard from '../../components/Card/FeatureCard';
import '../../styles/pages/StoreSUV/StoreSUV.css';

interface Hypercar {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    danh_muc_id: number;
}

const StoreSUV: React.FC = () => {
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
            title: "Giao xe tận nơi.",
            description: "Miễn phí giao nhận xe trong nội thành TP.HCM."
        },
        {
            icon: "fa-brands fa-aws",
            title: "Hỗ trợ 24/7.",
            description: "Đội ngũ kỹ thuật hỗ trợ mọi lúc mọi nơi."
        },
        {
            icon: "fa-brands fa-battle-net",
            title: "Bảo mật tuyệt đối.",
            description: "Thông tin khách hàng được bảo mật 100%."
        },
        {
            icon: "fa-brands fa-bity",
            title: "Đa dạng dòng xe.",
            description: "Hơn 50 mẫu siêu xe từ các thương hiệu hàng đầu."
        },
        {
            icon: "fa-brands fa-bitcoin",
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
        const fetchSUV = async () => {
            try {
                // 1. Fetch categories to find SUV ID
                const catResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien');
                const catResult = await catResponse.json();

                let suvId = '3'; // Default fallback

                if (catResult.success && Array.isArray(catResult.data)) {
                    const suvCategory = catResult.data.find((c: any) =>
                        c.ten_danh_muc.toLowerCase().includes('suv')
                    );
                    if (suvCategory) {
                        suvId = suvCategory.danh_muc_id.toString();
                    }
                }

                // 2. Fetch vehicles with found ID
                const params = new URLSearchParams({
                    danh_muc_id: suvId,
                    trang_thai: 'SAN_SANG',
                    fields: 'gia_thue,img,loai,ten_phuong_tien,phuong_tien_id,danh_muc_id'
                });
                const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/phuong-tien?${params.toString()}`);
                const result = await response.json();

                console.log("Full SUV API Response:", result);

                if (result.success && Array.isArray(result.data)) {
                    setVehicles(result.data);
                }
            } catch (error) {
                console.error('Error fetching SUVs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSUV();
    }, []);

    return (
        <div className="StoreSUV-container">
            <Header />
            <div className="StoreSUV-content">
                <div className="StoreSUV-header">
                    <h1 className="StoreSUV-title">SUV Sang Trọng</h1>
                    <p className="StoreSUV-subtitle">Trải nghiệm sự mạnh mẽ và tiện nghi đẳng cấp.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="StoreSUV-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.ten_phuong_tien}
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
            <div className="StoreSUV-feature-section">
                <div className="StoreSUV-feature-header">
                    <h2 className="StoreSUV-feature-title">Vì sao chọn chúng tôi?</h2>
                </div>

                <div className="StoreSUV-feature-scroll-container">
                    <div className="StoreSUV-feature-scroll-box">
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

export default StoreSUV;
