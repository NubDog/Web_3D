import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import Button from '../components/Button/Button';
import { useAuth } from '../contexts/AuthContext';
import './../styles/pages/AccountOrder/AccountOrder.css';

interface DonThue {
    don_thue_id: number;
    khach_hang_id: number;
    phuong_tien_id: number;
    chinh_sach_id: number;
    nhan_vien_tao: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    dia_diem_nhan: string;
    dia_diem_tra: string;
    trang_thai: string;
    tong_tien: number;
    tien_coc_yeu_cau: number;
    ghi_chu: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
}

const AccountOrder = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<DonThue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    console.log(currentUser);

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/user-orders';

    // Fetch orders data
    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser?.nguoi_dung_id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}?nguoi_dung_id=${currentUser.nguoi_dung_id}`);
                const result = await response.json();

                if (result.success) {
                    setOrders(result.data);
                } else {
                    setError(result.error || 'Không thể tải danh sách đơn thuê');
                }
            } catch (err: any) {
                setError('Lỗi kết nối đến server');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [currentUser]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'da_xac_nhan': return '#007AFF';
            case 'dang_thuc_hien': return '#FF9500';
            case 'hoan_thanh': return '#34C759';
            case 'da_huy': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    // Get status text
    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'da_xac_nhan': return 'Đã xác nhận';
            case 'dang_thuc_hien': return 'Đang thực hiện';
            case 'hoan_thanh': return 'Hoàn thành';
            case 'da_huy': return 'Đã hủy';
            default: return status;
        }
    };

    // If not logged in
    if (!currentUser) {
        return (
            <div className="accountOrder-container">
                <Header />
                <div className="accountOrder-not-logged-in">
                    <div className="accountOrder-login-prompt">
                        <h2>Vui lòng đăng nhập</h2>
                        <p>Bạn cần đăng nhập để xem danh sách đơn thuê</p>
                        <Link to="/signin">
                            <Button conttent="Đăng nhập" />
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="accountOrder-container">
                <Header />
                <div className="accountOrder-loading">
                    <div className="loading-spinner"></div>
                    <h2>Đang tải danh sách đơn thuê...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="accountOrder-container">
            <Header />
            <div className="accountOrder-content">
                <div className="accountOrder-header">
                    <h1>Đơn thuê của tôi</h1>
                    <div className="accountOrder-actions">
                        <Link to="/account_home">
                            <Button conttent="Quay lại tài khoản" />
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="accountOrder-error">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="accountOrder-empty">
                        <div className="empty-icon">
                            <i className="fa-solid fa-file-lines"></i>
                        </div>
                        <h3>Chưa có đơn thuê nào</h3>
                        <p>Bạn chưa có đơn thuê nào. Hãy khám phá cửa hàng để thuê phương tiện yêu thích!</p>
                        <Link to="/store">
                            <Button conttent="Khám phá cửa hàng" />
                        </Link>
                    </div>
                ) : (
                    <div className="accountOrder-list">
                        {orders.map((order) => (
                            <div key={order.don_thue_id} className="order-card">
                                <div className="order-header">
                                    <div className="order-id">
                                        <span className="label">Mã đơn:</span>
                                        <span className="value">#{order.don_thue_id}</span>
                                    </div>
                                    <div 
                                        className="order-status"
                                        style={{ color: getStatusColor(order.trang_thai) }}
                                    >
                                        {getStatusText(order.trang_thai)}
                                    </div>
                                </div>

                                <div className="order-body">
                                    <div className="order-info-grid">
                                        <div className="info-item">
                                            <span className="label">Ngày bắt đầu:</span>
                                            <span className="value">{formatDate(order.ngay_bat_dau)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Ngày kết thúc:</span>
                                            <span className="value">{formatDate(order.ngay_ket_thuc)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Địa điểm nhận:</span>
                                            <span className="value">{order.dia_diem_nhan}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Địa điểm trả:</span>
                                            <span className="value">{order.dia_diem_tra}</span>
                                        </div>
                                    </div>

                                    <div className="order-financial">
                                        <div className="financial-item">
                                            <span className="label">Tổng tiền:</span>
                                            <span className="value total-amount">{formatCurrency(order.tong_tien)}</span>
                                        </div>
                                        <div className="financial-item">
                                            <span className="label">Tiền cọc:</span>
                                            <span className="value">{formatCurrency(order.tien_coc_yeu_cau)}</span>
                                        </div>
                                    </div>

                                    {order.ghi_chu && (
                                        <div className="order-note">
                                            <span className="label">Ghi chú:</span>
                                            <span className="value">{order.ghi_chu}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="order-footer">
                                    <div className="order-date">
                                        Đặt ngày: {formatDate(order.ngay_tao)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default AccountOrder;