import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/pages/StoreBike/StoreBike.css';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import Button from '../components/Button/Button';
import videoShowcase from '../assets/Video ShowCase/Ninja H2： Vol.10 Ninja H2R - BUILT BEYOND BELIEF.mp4';
import placeholderBike from '../assets/Ninja H2R.png';

interface PhuongTien {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    trang_thai: string;
    gia_co_ban: number;
    chinh_sach_id: number;
    danh_muc_id: number;
    loai: string;
    bien_so: string;
    so_km: number;
    img?: string;
}

interface ChinhSachGia {
    chinh_sach_id: number;
    gia_co_ban: number;
    ten_chinh_sach: string;
}

const StoreBike = () => {
    const navigate = useNavigate();
    const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoScale, setVideoScale] = useState(1);
    const videoRef = useRef<HTMLVideoElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';
    const API_URL_CHINH_SACH_GIA = 'https://r2-api.sharkeatrice.workers.dev/api/chinh-sach-gia';

    // Fetch data từ API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const fieldsPhuongTien = 'phuong_tien_id,ten_phuong_tien,trang_thai,chinh_sach_id,loai,img,danh_muc_id,bien_so,so_km';
                const response = await fetch(`${API_URL}?fields=${fieldsPhuongTien}`);
                
                const fieldsChinhSach = 'chinh_sach_id,gia_co_ban,ten_chinh_sach';
                const responseChinhSachGia = await fetch(`${API_URL_CHINH_SACH_GIA}?fields=${fieldsChinhSach}`);

                if (!response.ok || !responseChinhSachGia.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();
                const resultChinhSachGia = await responseChinhSachGia.json();

                if (result.success && resultChinhSachGia.success) {
                    const activeVehicles = result.data.filter((pt: PhuongTien) => pt.trang_thai === 'SAN_SANG');
                    const activeVehiclesBike = activeVehicles.filter((pd: PhuongTien) => pd.danh_muc_id == 1);

                    const vehiclesWithPrice = activeVehiclesBike.map((pt: PhuongTien) => {
                        const chinhSach = resultChinhSachGia.data.find((cs: ChinhSachGia) => cs.chinh_sach_id === pt.chinh_sach_id);
                        return {
                            ...pt,
                            gia_co_ban: chinhSach ? chinhSach.gia_co_ban : 0,
                            ten_chinh_sach: chinhSach ? chinhSach.ten_chinh_sach : 'Không có chính sách'
                        }
                    });

                    setPhuongTien(vehiclesWithPrice);
                } else {
                    throw new Error('Không thể lấy dữ liệu từ một trong hai API');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle video scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                const scrollY = window.scrollY;
                const heroHeight = heroRef.current.offsetHeight;
                const halfHeroHeight = heroHeight * 2; // Bắt đầu thu nhỏ từ 1/2 hero height
                
                if (scrollY >= halfHeroHeight) {
                    // Tính progress từ 1/2 hero height đến cuối hero
                    const remainingHeight = heroHeight - halfHeroHeight;
                    const progress = Math.min((scrollY - halfHeroHeight) / remainingHeight, 1);
                    
                    // Scale từ 100vw về 1912px
                    const viewportWidth = window.innerWidth;
                    const targetWidth = 1912;
                    
                    let targetScale;
                    if (viewportWidth > targetWidth) {
                        // Màn hình lớn hơn 1912px: thu nhỏ về 1912px
                        targetScale = targetWidth / viewportWidth;
                    } else {
                        // Màn hình nhỏ hơn hoặc bằng 1912px: thu nhỏ nhẹ để tạo hiệu ứng
                        targetScale = 0.85; // Thu nhỏ 15%
                    }
                    
                    // Interpolate từ scale 1 về targetScale
                    const scale = 1 - (progress * (1 - targetScale));
                    setVideoScale(Math.max(scale, targetScale));
                } else {
                    setVideoScale(1);
                }
            }
        };

        // Initial call để set đúng scale khi load page
        handleScroll();
        
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll); // Update khi resize window
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    const handleViewDetail = (product: PhuongTien) => {
        navigate('/product_detail', {
            state: {
                product: {
                    id: product.phuong_tien_id,
                    product_name: product.ten_phuong_tien,
                    product_category: product.loai,
                    product_price: product.gia_co_ban,
                    img: product.img
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="store-bike-page">
                <Header />
                <div className="store-bike-loading">
                    <h2>Đang tải dữ liệu xe máy...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-bike-page">
                <Header />
                <div className="store-bike-error">
                    <h2>Có lỗi xảy ra: {error}</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="store-bike-page">
            <Header />
            
            {/* Hero Section với Video */}
            <div className="store-bike-hero" ref={heroRef}>
                <div className="store-bike-container">
                    <div className="store-bike-title-section">
                        <h2 className="store-bike-title">
                            Xe 2 bánh
                            <span className="store-bike-subtitle">Bạn muốn đi đâu là nó đưa bạn tới đó</span>
                        </h2>
                    </div>
                </div>
                
                <div className="store-bike-video-container">
                    <video 
                        ref={videoRef}
                        className="store-bike-video"
                        style={{
                            transform: `scale(${videoScale})`,
                            transformOrigin: 'center top'
                        }}
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        controls={false}
                    >
                        <source src={videoShowcase} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                    </video>
                </div>
            </div>

            {/* Products Section */}
            <div className="store-bike-products">
                <div className="store-bike-container">
                    {phuongTien.map((product) => (
                        <div key={product.phuong_tien_id} className="store-bike-product-item">
                            <div className="store-bike-product-image-container">
                                <img 
                                    src={product.img || placeholderBike} 
                                    alt={product.ten_phuong_tien}
                                    className="store-bike-product-image"
                                    onError={(e) => {
                                        e.currentTarget.src = placeholderBike;
                                    }}
                                />
                                <div className="store-bike-product-overlay">
                                    <Button 
                                        conttent="Xem chi tiết xe"
                                        onClick={() => handleViewDetail(product)}
                                    />
                                </div>
                            </div>
                            
                            <div className="store-bike-product-info">
                                <h3 className="store-bike-product-name">{product.ten_phuong_tien}</h3>
                                <p className="store-bike-product-category">{product.loai}</p>
                                
                                <div className="store-bike-product-details">
                                    <div className="store-bike-detail-item">
                                        <span className="store-bike-detail-label">Biển số:</span>
                                        <span className="store-bike-detail-value">{product.bien_so || 'Chưa có thông tin'}</span>
                                    </div>
                                    <div className="store-bike-detail-item">
                                        <span className="store-bike-detail-label">Số km:</span>
                                        <span className="store-bike-detail-value">{product.so_km ? product.so_km.toLocaleString('vi-VN') + ' km' : 'Chưa có thông tin'}</span>
                                    </div>
                                </div>
                                
                                <p className="store-bike-product-price">
                                    {product.gia_co_ban ? product.gia_co_ban.toLocaleString('vi-VN') + ' VNĐ/ngày' : 'Liên hệ để biết giá'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default StoreBike;