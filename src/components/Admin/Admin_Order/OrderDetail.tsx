import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './../css/Admin_orderdetail.css'
import { FaUserCircle, FaCar, FaFileInvoiceDollar, FaCalendarAlt } from 'react-icons/fa';
import OrderTimeline from '../Component-Admin/Component-OrderTimeline';
import ReturnVehicleModal from '../Component-Admin/ReturnVehicleModal';

import { useAuth } from '../../contexts-login-tam-thoi/AuthContext';
import HandoverModal from '../Component-Admin/HandoverModal';
import FinalizeModal from '../Component-Admin/Component-FinalizeModal';
import CancelOrderModal from '../Component-Admin/CancelOrderModal';


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
    tien_coc_id: number | null;
    trang_thai_coc: 'DANG_GIU' | 'CHO_THANH_TOAN' | string | null;
    gia_thue: number; 
    ty_le_giam: number;    
    
}

const OrderDetail: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    
     const { user } = useAuth();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
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
                body: JSON.stringify({ nhan_vien_id: 1}) 
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

    const handleCancel = async (reason: string) => {
        // if (!user) return toast.error("Vui lòng đăng nhập.");

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: user?.id || 1, ly_do_huy: reason })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.warn("Đã hủy đơn hàng thành công.");
            setIsCancelModalOpen(false); 
            fetchOrder(); 
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

      const handleHandover = async (data: { so_km: string; muc_xang: string; ghi_chu_hu_hong: string; anh_minh_chung: FileList | null; }) => {
        
        const formData = new FormData();
        formData.append("so_km", data.so_km);
        formData.append("muc_xang", data.muc_xang);
        formData.append("ghi_chu_hu_hong", data.ghi_chu_hu_hong);
        formData.append("nhan_vien_id", String(user?.id || 1));
        
        if (data.anh_minh_chung) {
            for (let i = 0; i < data.anh_minh_chung.length; i++) {
                formData.append('anh_minh_chung', data.anh_minh_chung[i]);
            }
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8787/api/don-thue/${orderId}/handover`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            toast.success("Bàn giao xe thành công!");
            setIsHandoverModalOpen(false);
            fetchOrder();
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

     const handleReturn = async (data: { so_km_tra: string; muc_xang_tra: string; ghi_chu_hu_hong_moi: string; anh_minh_chung: FileList | null }) => {
        // if (!user) return toast.error("Vui lòng đăng nhập.");

        const formData = new FormData();
        formData.append("so_km_tra", data.so_km_tra);
        formData.append("muc_xang_tra", data.muc_xang_tra);
        formData.append("ghi_chu_hu_hong_moi", data.ghi_chu_hu_hong_moi);
        formData.append("nhan_vien_id", String(user?.id || 1));

        if (data.anh_minh_chung) {
            for (let i = 0; i < data.anh_minh_chung.length; i++) {
                formData.append('anh_minh_chung', data.anh_minh_chung[i]);
            }
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
            setIsReturnModalOpen(false); 
            fetchOrder();
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDeposit = async () => {
    if (!order?.tien_coc_id) {
        toast.error("Không tìm thấy thông tin tiền cọc để xác nhận.");
        return;
    }
    // if (!user) return toast.error("Vui lòng đăng nhập.");

    setIsSubmitting(true);
    try {
        const response = await fetch(`http://127.0.0.1:8787/api/deposits/${order.tien_coc_id}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nhan_vien_id: user?.id || 1})
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        
        toast.success("Đã xác nhận nhận tiền cọc!");
        
        fetchOrder(); 

    } catch (err: any) {
        toast.error(`Lỗi: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
};

    const handleFinalize = async (data: { phi_hu_hong: number; phi_tre: number; chi_phi_khac: number; ghi_chu_quyet_toan: string; }) => {
        // if (!user) {
        //     toast.error("Vui lòng đăng nhập để thực hiện hành động này.");
        //     return;
        // }
        
        const body = {
            nhan_vien_id: user?.id || 1,
            ...data
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
            setIsFinalizeModalOpen(false); 
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
                    <>
                    <button 
                        className="button-primary" 
                        onClick={() => setIsHandoverModalOpen(true)} 
                        disabled={isSubmitting || order.trang_thai_coc !== 'DANG_GIU'}
                        title={order.trang_thai_coc !== 'DANG_GIU' ? 'Cần xác nhận tiền cọc trước' : ''}
                    >
                        🚚 Bàn Giao Xe
                    </button>
                    <button 
                            className="button-reject" 
                            onClick={() => setIsCancelModalOpen(true)}
                            disabled={isSubmitting || order.trang_thai_coc === 'DANG_GIU'}
                            
                        >
                            ❌ Hủy Đơn
                        </button>
                    </>
                    );
            case 'DANG_THUE':
                 return (
                   <button className="button-primary" onClick={() => setIsReturnModalOpen(true)} disabled={isSubmitting}>
                        ➡️ Tiếp Nhận Xe Trả
                    </button>
                 );
            case 'DA_TRA':
                 return (
                    <button className="button-primary" onClick={() => setIsFinalizeModalOpen(true)} disabled={isSubmitting}>
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

    const ngayBatDau = new Date(order.ngay_bat_dau);
    const ngayKetThuc = new Date(order.ngay_ket_thuc);
    const soNgayThue = Math.ceil((ngayKetThuc.getTime() - ngayBatDau.getTime()) / (1000 * 60 * 60 * 24));

    const tamTinh = order.gia_thue* soNgayThue;
    const tienGiamGia = tamTinh * order.ty_le_giam;
    const tongTienCuoiCung = tamTinh - tienGiamGia;

    const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };


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
                        <h2><FaFileInvoiceDollar /> Thông tin Tài chính</h2>
                        <div className="financial-breakdown">
                            <div className="fi-row">
                                <span>Giá thuê:</span>
                                <span>{formatCurrency(order.gia_thue)} x {soNgayThue} ngày</span>
                            </div>
                            <div className="fi-row subtotal">
                                <span>Tạm tính:</span>
                                <span>{formatCurrency(tamTinh)}</span>
                            </div>
                            <div className="fi-row discount">
                                <span>Khuyến mãi ({order.ten_chinh_sach} -{order.ty_le_giam * 100}%):</span>
                                <span>-{formatCurrency(tienGiamGia)}</span>
                            </div>
                            <hr className="fi-divider" />
                            <div className="fi-row total">
                                <span>Tổng tiền thuê:</span>
                                <span>{formatCurrency(tongTienCuoiCung)}</span>
                            </div>
                            <div className="fi-row">
                                <span>Tiền cọc yêu cầu:</span>
                                <span>{formatCurrency(order.tien_coc_yeu_cau)}</span>
                            </div>
                        </div>
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

                    {order.trang_thai === 'DA_DUYET' && (
                        <div className="info-card">
                            <h2>Tình Trạng Thanh Toán</h2>
                            <p>
                                <strong>Tiền cọc:</strong> 
                                <span className={`status-badge status-${order.trang_thai_coc}`}>
                                    {order.trang_thai_coc === 'DANG_GIU' ? 'Đã Nhận Cọc' : 'Chưa Nhận Cọc'}
                                </span>
                            </p>
                            {order.trang_thai_coc !== 'DANG_GIU' && (
                                <button 
                                    className="button-primary" 
                                    style={{width: '100%', marginTop: '1rem'}}
                                    onClick={handleConfirmDeposit}
                                    disabled={isSubmitting}
                                >
                                    Xác nhận đã nhận cọc
                                </button>
                            )}
                        </div>
                    )}

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
                <HandoverModal 
                isOpen={isHandoverModalOpen}
                onClose={() => setIsHandoverModalOpen(false)}
                onSubmit={handleHandover}
                isSubmitting={isSubmitting}
                />
                 <FinalizeModal
                isOpen={isFinalizeModalOpen}
                onClose={() => setIsFinalizeModalOpen(false)}
                onSubmit={handleFinalize}
                isSubmitting={isSubmitting}
                order={order}
                />
                 <CancelOrderModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onSubmit={handleCancel}
                isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
};

export default OrderDetail;