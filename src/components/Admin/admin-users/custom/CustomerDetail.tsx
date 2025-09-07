import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './css/CustomerDetail.css'; 

// Interface cho dữ liệu khách hàng
interface Customer {
    khach_hang_id: number;
    nguoi_dung_id: number;
    ho_ten: string;
    ngay_sinh: string;
    dia_chi: string;
    thanh_pho: string;
    tinh: string;
    ma_buu_chinh?: string;
    quoc_gia?: string;
}

const CustomerDetail: React.FC = () => {
    const { userId } = useParams<{ userId: string }>(); // Lấy userId từ URL
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = 'http://127.0.0.1:8787';

    useEffect(() => {
        const fetchCustomer = async () => {
            if (!userId) return;
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/customers/by-user/${userId}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Không thể tải dữ liệu khách hàng.');
                }
                setCustomer(result.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomer();
    }, [userId]); // Chạy lại khi userId thay đổi

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Chưa có';
        // Chỉ lấy phần ngày/tháng/năm
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (isLoading) {
        return <div className="customer-detail-container"><p>Đang tải thông tin khách hàng...</p></div>;
    }

    if (error) {
        return <div className="customer-detail-container error-message">{error}</div>;
    }

    return (
        <div className="customer-detail-container">
            <header className="customer-detail-header">
                <h1>Chi tiết hồ sơ khách hàng</h1>
                <Link to="/admin/users" className="back-button">Quay lại danh sách</Link>
            </header>
            
            {customer ? (
                <div className="customer-detail-card">
                    <div className="detail-item">
                        <span className="detail-label">Họ và Tên</span>
                        <span className="detail-value">{customer.ho_ten}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Ngày sinh</span>
                        <span className="detail-value">{formatDate(customer.ngay_sinh)}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Địa chỉ</span>
                        <span className="detail-value">{customer.dia_chi}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Thành phố</span>
                        <span className="detail-value">{customer.thanh_pho}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Tỉnh</span>
                        <span className="detail-value">{customer.tinh}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Mã bưu chính</span>
                        <span className="detail-value">{customer.ma_buu_chinh || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Quốc gia</span>
                        <span className="detail-value">{customer.quoc_gia || 'N/A'}</span>
                    </div>
                </div>
            ) : (
                <p>Không tìm thấy thông tin khách hàng.</p>
            )}
        </div>
    );
};

export default CustomerDetail;