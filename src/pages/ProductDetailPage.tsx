import { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import BabylonScene from '../components/babylon';
import Button from '../components/Button/Button';
import './../styles/pages/ProductDetailPage/ProductDetailPage.css';

interface VehicleDetail {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    danh_muc_id: number;
    trang_thai: string;
    bien_so: string;
    so_km: number;
    chinh_sach_id: number;
    so_khung: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
    img: string;
    gia_thue: number;
    model: string;
}

interface ChinhSachGia {
    chinh_sach_id: number;
    gia_co_ban: number;
    ten_chinh_sach: string;
}

const ProductDetailPage = () => {
    const location = useLocation();
    const { product } = location.state || {};
    
    const [vehicleDetail, setVehicleDetail] = useState<VehicleDetail | null>(null);
    const [pricing, setPricing] = useState<ChinhSachGia | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';
    const API_URL_CHINH_SACH_GIA = 'https://r2-api.sharkeatrice.workers.dev/api/chinh-sach-gia';

    useEffect(() => {
        const fetchVehicleDetail = async () => {
            if (!product?.id) {
                setError('Không có ID sản phẩm');
                setLoading(false);
                return;
            }

            try {
                // Fetch thông tin chi tiết phương tiện
                const response = await fetch(`${API_URL}`);
                const responseChinhSach = await fetch(`${API_URL_CHINH_SACH_GIA}`);
                
                if (!response.ok || !responseChinhSach.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }

                const result = await response.json();
                const resultChinhSach = await responseChinhSach.json();

                if (result.success && resultChinhSach.success) {
                    // Tìm phương tiện theo ID
                    const vehicle = result.data.find((v: VehicleDetail) => v.phuong_tien_id === product.id);
                    
                    if (!vehicle) {
                        throw new Error('Không tìm thấy phương tiện');
                    }

                    // Tìm thông tin giá
                    const priceInfo = resultChinhSach.data.find((cs: ChinhSachGia) => cs.chinh_sach_id === vehicle.chinh_sach_id);

                    setVehicleDetail(vehicle);
                    setPricing(priceInfo || null);
                    console.log(vehicle);
                } else {
                    throw new Error('Không thể lấy dữ liệu từ API');
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicleDetail();
    }, [product]);

    if (loading) {
        return (
            <div>
                <Header />
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Đang tải thông tin...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !vehicleDetail) {
        return (
            <div>
                <Header />
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Không tìm thấy thông tin sản phẩm.</h2>
                    <p>{error}</p>
                    <RouterLink to="/store">Quay lại cửa hàng</RouterLink>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="ProductDetail-container">
            <Header />
            
            {/* 3D Model Viewer */}
            <div className="ProductDetail-viewer-container">
                <div className="ProductDetail-3d-viewer">
                    {vehicleDetail.model ? (
                        <BabylonScene 
                            modelUrl={vehicleDetail.model}
                            onModelLoaded={() => console.log('Model loaded successfully')}
                        />
                    ) : (
                        <div className="ProductDetail-no-model">
                            <p>Không có mô hình 3D</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="ProductDetail-content">
                <div className="ProductDetail-info">
                    <h1 className="ProductDetail-title">{vehicleDetail.ten_phuong_tien}</h1>
                    
                    <div className="ProductDetail-price">
                        <span className="ProductDetail-price-amount">
                            {pricing?.gia_co_ban ? pricing.gia_co_ban.toLocaleString('vi-VN') : vehicleDetail.gia_thue?.toLocaleString('vi-VN') || 'Vui lòng liên hệ'}
                        </span>
                        <span className="ProductDetail-price-unit"> VNĐ/ngày</span>
                    </div>

                    <div className="ProductDetail-specifications">
                        <h3>Thông tin chi tiết</h3>
                        <div className="ProductDetail-spec-grid">
                            <div className="ProductDetail-spec-item">
                                <span className="ProductDetail-spec-label">Loại xe:</span>
                                <span className="ProductDetail-spec-value">{vehicleDetail.loai}</span>
                            </div>
                            <div className="ProductDetail-spec-item">
                                <span className="ProductDetail-spec-label">Biển số:</span>
                                <span className="ProductDetail-spec-value">{vehicleDetail.bien_so}</span>
                            </div>
                            <div className="ProductDetail-spec-item">
                                <span className="ProductDetail-spec-label">Số km đã đi:</span>
                                <span className="ProductDetail-spec-value">{vehicleDetail.so_km?.toLocaleString('vi-VN')} km</span>
                            </div>
                            <div className="ProductDetail-spec-item">
                                <span className="ProductDetail-spec-label">Số khung:</span>
                                <span className="ProductDetail-spec-value">{vehicleDetail.so_khung}</span>
                            </div>
                            <div className="ProductDetail-spec-item">
                                <span className="ProductDetail-spec-label">Trạng thái:</span>
                                <span className="ProductDetail-spec-value">
                                    {vehicleDetail.trang_thai === 'SAN_SANG' ? 'Sẵn sàng' : vehicleDetail.trang_thai}
                                </span>
                            </div>
                            {pricing && (
                                <div className="ProductDetail-spec-item">
                                    <span className="ProductDetail-spec-label">Chính sách giá:</span>
                                    <span className="ProductDetail-spec-value">{pricing.ten_chinh_sach}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <div className="ProductDetail-actions">
                        <RouterLink 
                            to="/checkout" 
                            state={{ 
                                product: {
                                    id: vehicleDetail.phuong_tien_id,
                                    product_name: vehicleDetail.ten_phuong_tien,
                                    product_category: vehicleDetail.loai,
                                    product_price: pricing?.gia_co_ban || vehicleDetail.gia_thue,
                                    img: vehicleDetail.img
                                }
                            }}
                        >
                            <Button conttent="Thuê ngay" />
                        </RouterLink>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProductDetailPage;
