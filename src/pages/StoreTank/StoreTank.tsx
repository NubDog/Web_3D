import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/Footer';
import HypercarCard2 from '../../components/Card/HypercarCard2.0';
import FeatureCard from '../../components/Card/FeatureCard';
import '../../styles/pages/StoreTank/StoreTank.css';

interface Hypercar {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    img: string;
    gia_thue: number;
    trang_thai: string;
    danh_muc_id: number;
}

const StoreTank: React.FC = () => {
    const [vehicles, setVehicles] = useState<Hypercar[]>([]);
    const [loading, setLoading] = useState(true);

    const featureCards = [
        {
            icon: "fa-solid fa-shield-halved",
            title: "Bọc thép siêu bền.",
            description: "An toàn tuyệt đối với lớp giáp chống đạn chuẩn quân sự."
        },
        {
            icon: "fa-brands fa-telegram",
            title: "Hỏa lực mạnh mẽ.",
            description: "Trang bị hệ thống vũ khí giả lập tiên tiến nhất."
        },
        {
            icon: "fa-brands fa-accusoft",
            title: "Vượt mọi địa hình.",
            description: "Băng rừng, lội suối, leo dốc dễ dàng với bánh xích."
        },
        {
            icon: "fa-brands fa-aws",
            title: "Huấn luyện chuyên nghiệp.",
            description: "Khoá hướng dẫn lái xe tăng cấp tốc từ chuyên gia."
        },
        {
            icon: "fa-brands fa-battle-net",
            title: "Trải nghiệm thực tế.",
            description: "Cảm giác cầm lái cỗ máy chiến tranh đích thực."
        },
        {
            icon: "fa-brands fa-bity",
            title: "Đa dạng mẫu mã.",
            description: "Từ xe tăng cổ điển đến các dòng hiện đại nhất."
        },
        {
            icon: "fa-brands fa-bitcoin",
            title: "Giá thuê cạnh tranh.",
            description: "Chi phí hợp lý cho trải nghiệm độc nhất vô nhị."
        },
        {
            icon: "fa-solid fa-calendar-check",
            title: "Đặt lịch nhanh gọn.",
            description: "Hỗ trợ thủ tục pháp lý đầy đủ khi thuê."
        }
    ];

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                // 1. Fetch categories to find Tank ID
                const catResponse = await fetch('https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien');
                const catResult = await catResponse.json();

                let catId = '7'; // Default fallback (Assumption, will verify dynamically)

                if (catResult.success && Array.isArray(catResult.data)) {
                    // Search for "tank" or "tăng"
                    const category = catResult.data.find((c: any) => {
                        const name = c.ten_danh_muc.toLowerCase();
                        return name.includes('tank') || name.includes('tăng');
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

                console.log("Full Tank API Response:", result);

                if (result.success && Array.isArray(result.data)) {
                    setVehicles(result.data);
                }
            } catch (error) {
                console.error('Error fetching tanks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    return (
        <div className="StoreTank-container">
            <Header />
            <div className="StoreTank-content">
                <div className="StoreTank-header">
                    <h1 className="StoreTank-title">Tank</h1>
                    <p className="StoreTank-subtitle">Sức mạnh thép, thống trị mọi địa hình.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                ) : (
                    <div className="StoreTank-grid">
                        {vehicles.map((item) => (
                            <HypercarCard2
                                key={item.phuong_tien_id}
                                id={item.phuong_tien_id}
                                name={item.ten_phuong_tien}
                                imageUrl={item.img}
                                price={item.gia_thue}
                                status={item.trang_thai}
                                description={`Uy lực vượt trội cùng ${item.loai}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feature Section */}
            <div className="StoreTank-feature-section">
                <div className="StoreTank-feature-header">
                    <h2 className="StoreTank-feature-title">Trải nghiệm quân sự đỉnh cao</h2>
                </div>

                <div className="StoreTank-feature-scroll-container">
                    <div className="StoreTank-feature-scroll-box">
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

export default StoreTank;
