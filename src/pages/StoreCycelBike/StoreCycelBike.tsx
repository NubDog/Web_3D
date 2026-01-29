import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/Footer';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import FeatureCard from '../../components/Card/FeatureCard';
import '../../styles/pages/StoreCycelBike/StoreCycelBike.css';

interface Hypercar {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    danh_muc_id: number;
}

const StoreCycelBike: React.FC = () => {
    const [vehicles, setVehicles] = useState<Hypercar[]>([]);
    const [loading, setLoading] = useState(true);

    const featureCards = [
        {
            icon: "fa-solid fa-credit-card",
            title: "Thanh toán linh hoạt.",
            description: "Hỗ trợ nhiều phương thức thanh toán tiện lợi."
        },
        {
            icon: "fa-brands fa-telegram",
            title: "Bảo hiểm trọn gói.",
            description: "An tâm tuyệt đối trên mọi cung đường."
        },
        {
            icon: "fa-brands fa-accusoft",
            title: "Giao xe tận nơi.",
            description: "Tiết kiệm thời gian, nhận xe ngay tại nhà."
        },
        {
            icon: "fa-brands fa-aws",
            title: "Hỗ trợ 24/7.",
            description: "Luôn đồng hành cùng bạn mọi lúc mọi nơi."
        },
        {
            icon: "fa-brands fa-battle-net",
            title: "Chất lượng hàng đầu.",
            description: "Xe được bảo dưỡng thường xuyên, vận hành êm ái."
        },
        {
            icon: "fa-brands fa-bity",
            title: "Đa dạng kiểu dáng.",
            description: "Phù hợp mọi nhu cầu: thể thao, địa hình, đường phố."
        },
        {
            icon: "fa-brands fa-bitcoin",
            title: "Giá thuê ưu đãi.",
            description: "Nhiều chương trình khuyến mãi hấp dẫn."
        },
        {
            icon: "fa-solid fa-calendar-check",
            title: "Đặt xe nhanh chóng.",
            description: "Thao tác đơn giản, xác nhận tức thì."
        }
    ];

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                // 1. Fetch categories to find Bicycle ID
                const catResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien');
                const catResult = await catResponse.json();

                let catId = '5'; // Default fallback (Assumption, will verify dynamically)

                if (catResult.success && Array.isArray(catResult.data)) {
                    // Search for "xe dap" or "bicycle"
                    const category = catResult.data.find((c: any) => {
                        const name = c.ten_danh_muc.toLowerCase();
                        // Handle naming variations: 'xe dap', 'xe đạp', 'bicycle', 'cycle'
                        return name.includes('xe đạp') || name.includes('xe dap') || name.includes('bicycle') || name.includes('cycle');
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

                console.log("Full Bicycle API Response:", result);

                if (result.success && Array.isArray(result.data)) {
                    setVehicles(result.data);
                }
            } catch (error) {
                console.error('Error fetching bicycles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    return (
        <div className="StoreCycelBike-container">
            <Header />
            <div className="StoreCycelBike-content">
                <div className="StoreCycelBike-header">
                    <h1 className="StoreCycelBike-title">Xe Đạp</h1>
                    <p className="StoreCycelBike-subtitle">Khỏe khoắn, năng động và thân thiện với môi trường.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="StoreCycelBike-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.ten_phuong_tien}
                                imageUrl={item.img}
                                price={item.gia_thue}
                                status={item.trang_thai}
                                description={`Cùng bạn khám phá mọi nẻo đường với ${item.loai}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feature Section */}
            <div className="StoreCycelBike-feature-section">
                <div className="StoreCycelBike-feature-header">
                    <h2 className="StoreCycelBike-feature-title">Vì sao bạn nên chọn xe đạp?</h2>
                </div>

                <div className="StoreCycelBike-feature-scroll-container">
                    <div className="StoreCycelBike-feature-scroll-box">
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

export default StoreCycelBike;
