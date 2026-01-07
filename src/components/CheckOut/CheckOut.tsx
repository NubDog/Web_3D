import React, { useState, useEffect } from 'react';
import './../../styles/components/CheckOut/CheckOut.css';
import imghold from './../../assets/Lamborghini Sian FKP 37.png';
import Sub_Button from './../../components/Button/Sub-Button/Sub-Button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CheckOutProps {
    onNext: (data: any) => void;
}

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


const CheckOut: React.FC<CheckOutProps> = ({ onNext }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);

    const { product } = location.state || {}; // { id: ... }

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/phuong-tien';

    useEffect(() => {
        const fetchVehicle = async () => {
            if (product?.id) {
                try {
                    const response = await fetch(API_URL);
                    const result = await response.json();
                    if (result.success) {
                        const foundVehicle = result.data.find((v: VehicleDetail) => v.phuong_tien_id === product.id);
                        if (foundVehicle) {
                            setVehicle(foundVehicle);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch vehicle info", error);
                }
            }
        };
        fetchVehicle();
    }, [product]);

    if (!product) {
        return <div>Không tìm thấy thông tin xe</div>;
    }

    const handleRentRequest = async () => {
        setIsLoading(true);
        try {
            if (!currentUser || !currentUser.nguoi_dung_id) {
                alert("Vui lòng đăng nhập để thuê xe!");
                navigate('/signin');
                return;
            }

            const userId = currentUser.nguoi_dung_id;

            const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/user/check-kyc?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Lỗi kết nối server');
            }

            const data = await response.json();

            if (data.success && data.hasKYC) {
                onNext({
                    product: vehicle ? {
                        id: vehicle.phuong_tien_id,
                        product_name: vehicle.ten_phuong_tien,
                        product_category: vehicle.loai,
                        product_price: vehicle.gia_thue,
                        img: vehicle.img
                    } : {}
                });
            } else {
                const confirmUpdate = window.confirm("Hồ sơ của bạn chưa có ảnh CCCD/CMND. Bạn cần cập nhật để thuê xe. Đi đến trang cập nhật ngay?");
                if (confirmUpdate) {
                    navigate('/account_home/account_home_kyc');
                }
            }

        } catch (error) {
            console.error("Lỗi kiểm tra KYC:", error);
            alert("Có lỗi xảy ra khi kiểm tra hồ sơ, vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='cheackOut-container'>
            <div className='cheackOut-content col-980'>

                <div className="checkOut-shipmentgroup">
                    <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Xác nhận thuê xe</p>

                    <div className="checkOut-product">
                        <img
                            src={vehicle?.img || imghold}
                            alt={vehicle?.ten_phuong_tien || "Vehicle"}
                        />

                        <div className="checkOut-product-infor">
                            <p style={{ fontWeight: 'bold' }}>{vehicle?.ten_phuong_tien || 'Đang tải...'}</p>
                            <p>{vehicle?.loai || '...'}</p>
                            <p style={{ color: '#007bff', cursor: 'pointer' }}>Xem chi tiết</p>
                        </div>
                    </div>

                    <div className="checkOut-product-shipment">
                        <div className="checkOut-product-shipment-option">
                            <div className='checkOut-product-shipment-message' style={{ marginTop: '0' }}>
                                <p><strong>Quy trình xử lý:</strong></p>
                                <ul>
                                    <li>Hệ thống sẽ kiểm tra hồ sơ CCCD/CMND của bạn.</li>
                                    <li>Nhân viên sẽ liên hệ xác nhận thời gian giao xe từ 8h - 22h.</li>
                                    <li>Vui lòng chuẩn bị bản gốc giấy tờ để đối chiếu khi nhận xe.</li>
                                </ul>
                                <a href="#">Xem Chính Sách Giao Xe Của Shark Eat Rice</a>
                            </div>
                        </div>
                    </div>

                    <div className="checkOut-button" style={{ marginTop: '20px' }}>
                        <Sub_Button
                            content={isLoading ? 'Đang kiểm tra hồ sơ...' : 'Gửi Yêu Cầu Thuê Xe'}
                            onClick={handleRentRequest}
                        />
                    </div>

                    <div className="checkOut-product-question">
                        <p>Câu hỏi thường gặp về giao hàng</p>
                        <i className="fa-solid fa-angle-down"></i>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckOut;