import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/Footer';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import FeatureCard from '../../components/Card/FeatureCard';
import '../../styles/pages/StoreFlycam/StoreFlycam.css';

interface Hypercar {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    danh_muc_id: number;
}

const StoreFlycam: React.FC = () => {
    const [vehicles, setVehicles] = useState<Hypercar[]>([]);
    const [loading, setLoading] = useState(true);

    const featureCards = [
        {
            icon: "fa-solid fa-camera",
            title: "Quay phim 4K.",
            description: "Chất lượng hình ảnh sắc nét, sống động từng chi tiết."
        },
        {
            icon: "fa-brands fa-telegram",
            title: "Bảo hiểm thiết bị.",
            description: "An tâm bay lượn với gói bảo hiểm rơi vỡ."
        },
        {
            icon: "fa-brands fa-accusoft",
            title: "Công nghệ AI.",
            description: "Tự động tránh vật cản, hỗ trợ bay thông minh."
        },
        {
            icon: "fa-brands fa-aws",
            title: "Hỗ trợ kỹ thuật.",
            description: "Hướng dẫn sử dụng chi tiết từ chuyên gia."
        },
        {
            icon: "fa-brands fa-battle-net",
            title: "Pin dung lượng cao.",
            description: "Thời gian bay dài, thỏa sức sáng tạo."
        },
        {
            icon: "fa-brands fa-bity",
            title: "Đa dạng chủng loại.",
            description: "Từ mini drone đến flycam chuyên nghiệp."
        },
        {
            icon: "fa-brands fa-bitcoin",
            title: "Giá thuê hợp lý.",
            description: "Tiết kiệm chi phí so với mua mới."
        },
        {
            icon: "fa-solid fa-calendar-check",
            title: "Đặt thuê dễ dàng.",
            description: "Thủ tục đơn giản, nhận máy ngay."
        }
    ];

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                // 1. Fetch categories to find Flycam ID
                const catResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien');
                const catResult = await catResponse.json();

                let catId = '6'; // Default fallback (Assumption, will verify dynamically)

                if (catResult.success && Array.isArray(catResult.data)) {
                    // Search for "flycam"
                    const category = catResult.data.find((c: any) => {
                        const name = c.ten_danh_muc.toLowerCase();
                        return name.includes('flycam') || name.includes('drone');
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

                console.log("Full Flycam API Response:", result);

                if (result.success && Array.isArray(result.data)) {
                    setVehicles(result.data);
                }
            } catch (error) {
                console.error('Error fetching flycams:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    return (
        <div className="StoreFlycam-container">
            <Header />
            <div className="StoreFlycam-content">
                <div className="StoreFlycam-header">
                    <h1 className="StoreFlycam-title">Flycam</h1>
                    <p className="StoreFlycam-subtitle">Ghi lại những khoảnh khắc tuyệt đẹp từ trên cao.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="StoreFlycam-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.loai}
                                imageUrl={item.img}
                                price={item.gia_thue}
                                status={item.trang_thai}
                                description={`Khám phá góc nhìn mới cùng ${item.loai}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feature Section */}
            <div className="StoreFlycam-feature-section">
                <div className="StoreFlycam-feature-header">
                    <h2 className="StoreFlycam-feature-title">Công nghệ bay đỉnh cao</h2>
                </div>

                <div className="StoreFlycam-feature-scroll-container">
                    <div className="StoreFlycam-feature-scroll-box">
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

export default StoreFlycam;
