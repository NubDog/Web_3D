import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './../css/Admin_orderdetail.css'
import { FaUserCircle, FaCar, FaFileInvoiceDollar, FaCalendarAlt } from 'react-icons/fa';
import OrderTimeline from '../Component-Admin/Component-OrderTimeline';
import ReturnVehicleModal from '../Component-Admin/ReturnVehicleModal';

interface OrderDetail {
    don_thue_id: number;
    trang_thai: 'CHO_DUYET' | 'DA_DUYET' | 'DANG_THUE' | 'DA_TRA' | 'HOAN_TAT' | 'TU_CHOI';
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    dia_diem_nhan: string;
    dia_diem_tra: string;
    tong_tien: number;
    tien_coc_yeu_cau: number;
    ho_ten: string;
    email: string;
    ten_phuong_tien: string;
    bien_so: string;
    ten_chinh_sach: string;
}

const OrderDetail: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}`);
            const result = await response.json();
            if (result.success) {
                setOrder(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: 1 }) 
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.success("Duyệt đơn thành công!");
            navigate('/admin/orders/pending'); 
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReject = async () => {
        const reason = prompt("Nhập lý do từ chối:");
        if (reason === null) return; 

        setIsSubmitting(true);
        try {
             const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: 1, ly_do: reason })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.warn("Đã từ chối đơn hàng.");
            navigate('/admin/orders/pending');
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHandover = async () => {
        const so_km = prompt("Nhập số KM lúc giao xe:", "");
        if (!so_km) return;

        const formData = new FormData();
        formData.append("so_km", so_km);
        formData.append("muc_xang", "Đầy bình"); 
        formData.append("ghi_chu_hu_hong", "Không có"); 
        // formData.append("anh_minh_chung", file); 
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/handover`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.success("Bàn giao xe thành công! Đơn hàng đã bắt đầu.");
            fetchOrder(); 
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

     const handleReturn = async (data: { so_km_tra: string; muc_xang_tra: string; ghi_chu_hu_hong_moi: string }) => {
        const formData = new FormData();
        formData.append("so_km_tra", data.so_km_tra);
        formData.append("muc_xang_tra", data.muc_xang_tra);
        if (data.ghi_chu_hu_hong_moi) {
            formData.append("ghi_chu_hu_hong_moi", data.ghi_chu_hu_hong_moi);
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/return`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.success("Đã tiếp nhận xe trả. Vui lòng quyết toán.");
            setIsReturnModalOpen(false); // Đóng modal sau khi thành công
            fetchOrder(); 
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalize = async () => {
        const phi_hu_hong_str = prompt("Nhập phí hư hỏng (nếu có):", "0");
        const phi_tre_str = prompt("Nhập phí trả trễ (nếu có):", "0");
        if (phi_hu_hong_str === null || phi_tre_str === null) return;

        const body = {
            nhan_vien_id: 1, 
            phi_hu_hong: parseInt(phi_hu_hong_str) || 0,
            phi_tre: parseInt(phi_tre_str) || 0,
            ghi_chu_quyet_toan: "Đã quyết toán xong.",
        };

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success("Quyết toán đơn hàng thành công!");
            fetchOrder(); 
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

     const renderActionButtons = () => {
        if (!order) return null;

        switch (order.trang_thai) {
            case 'CHO_DUYET':
                return (
                    <>
                        <button className="button-approve" onClick={handleApprove} disabled={isSubmitting}>
                            {isSubmitting ? 'Đang xử lý...' : '✅ Duyệt Đơn'}
                        </button>
                        <button className="button-reject" onClick={handleReject} disabled={isSubmitting}>
                             {isSubmitting ? 'Đang xử lý...' : '❌ Từ Chối'}
                        </button>
                    </>
                );
            case 'DA_DUYET':
                return (
                    <button className="button-primary" onClick={handleHandover} disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : '🚚 Bàn Giao Xe'}
                    </button>
                );
            case 'DANG_THUE':
                 return (
                   <button className="button-primary" onClick={() => setIsReturnModalOpen(true)} disabled={isSubmitting}>
                        ➡️ Tiếp Nhận Xe Trả
                    </button>
                 );
            case 'DA_TRA':
                 return (
                    <button className="button-primary" onClick={handleFinalize} disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : '💰 Quyết Toán Đơn'}
                    </button>
                 );
            case 'HOAN_TAT':
                return <p>Đơn hàng đã hoàn tất.</p>;
            case 'TU_CHOI':
                return <p>Đơn hàng đã bị từ chối.</p>;
            default:
                return null;
        }
    };

    if (isLoading) return <div>Đang tải thông tin đơn hàng...</div>;
    if (error) return <div className="error-message">Lỗi: {error}</div>;
    if (!order) return <div>Không tìm thấy đơn hàng.</div>;

    return (
        <div className="order-detail-container">
            <header>
                <h1>Chi Tiết Đơn Hàng #{order.don_thue_id}</h1>
                <span className={`status-badge status-${order.trang_thai}`}>{order.trang_thai}</span>
            </header>

            <OrderTimeline status={order.trang_thai} />

            
            <div className="order-detail-layout">
                {/* CỘT BÊN TRÁI: THÔNG TIN CHÍNH */}
                <div className="main-content">
                    <div className="info-card">
                        <h2><FaCalendarAlt /> Thông tin Chuyến đi</h2>
                        <p><strong>Ngày bắt đầu:</strong> {new Date(order.ngay_bat_dau).toLocaleString('vi-VN')}</p>
                        <p><strong>Ngày kết thúc:</strong> {new Date(order.ngay_ket_thuc).toLocaleString('vi-VN')}</p>
                        <p><strong>Điểm nhận:</strong> {order.dia_diem_nhan}</p>
                        <p><strong>Điểm trả:</strong> {order.dia_diem_tra}</p>
                    </div>
                     <div className="info-card">
                        <h2><FaFileInvoiceDollar /> Thông tin Tài chính</h2>
                        <p><strong>Chính sách giá:</strong> {order.ten_chinh_sach}</p>
                        <p><strong>Tổng tiền thuê:</strong> {new Intl.NumberFormat('vi-VN').format(order.tong_tien)} VND</p>
                        <p><strong>Tiền cọc yêu cầu:</strong> {new Intl.NumberFormat('vi-VN').format(order.tien_coc_yeu_cau)} VND</p>
                    </div>
                </div>

                {/* CỘT BÊN PHẢI: THÔNG TIN PHỤ & HÀNH ĐỘNG */}
                <div className="sidebar-content">
                    <div className="info-card">
                        <h2><FaUserCircle /> Khách hàng</h2>
                        <p><strong>Họ tên:</strong> {order.ho_ten}</p>
                        <p><strong>Email:</strong> {order.email}</p>
                    </div>
                    <div className="info-card">
                        <h2><FaCar /> Phương tiện</h2>
                        <p><strong>Tên xe:</strong> {order.ten_phuong_tien}</p>
                        <p><strong>Biển số:</strong> {order.bien_so}</p>
                    </div>
                    <div className="info-card action-card">
                        <h2>Hành Động</h2>
                        <div className="order-actions">
                            {renderActionButtons()}
                        </div>
                    </div>
                </div>

                 <ReturnVehicleModal 
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                onSubmit={handleReturn}
                isSubmitting={isSubmitting}
            />
            </div>
        </div>
    );
};

export default OrderDetail;