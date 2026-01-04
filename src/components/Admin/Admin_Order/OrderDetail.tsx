import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './../css/Admin_orderdetail.css'
import { FaUserCircle, FaCar, FaFileInvoiceDollar, FaCalendarAlt } from 'react-icons/fa';
import OrderTimeline from '../Component-Admin/Component-OrderTimeline';
import ReturnVehicleModal from '../Component-Admin/ReturnVehicleModal';

import { useAuth } from '../../../contexts/AuthContext';

const API_BASE_URL = 'https://r2-api.sharkeatrice.workers.dev';
import HandoverModal from '../Component-Admin/HandoverModal';
import FinalizeModal from '../Component-Admin/Component-FinalizeModal';
import CancelOrderModal from '../Component-Admin/CancelOrderModal';
import VehicleRecordModal from '../Component-Admin/VehicleRecordModal';

interface OrderDetail {
    don_thue_id: number;
    trang_thai: 'CHO_DUYET' | 'DA_DUYET' | 'DANG_THUE' | 'DA_TRA' |'CHO_QUYET_TOAN'|'CHO_THANH_TOAN'| 'HOAN_TAT' | 'TU_CHOI';
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
    so_km_xe: number;
    ten_chinh_sach: string;
    tien_coc_id: number | null;
    trang_thai_coc: 'DANG_GIU' | 'CHO_THANH_TOAN' | string | null;
    gia_thue: number; 
    ty_le_giam: number;    
    
    giao_so_km: number | null;
    giao_muc_xang: string | null;
    giao_ghi_chu: string | null;
    giao_anh: string | null; 

    tra_so_km: number | null;
    tra_muc_xang: string | null;
    tra_ghi_chu: string | null;
    tra_anh: string | null; 
    ghi_chu: string | null;
    duong_dan_file?: string; 
}

interface RecordData {
    title: string;
    km: number | null;
    fuel: string | null;
    notes: string | null;
    imageUrls: string[];
}

const OrderDetail: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [recordModalData, setRecordModalData] = useState<RecordData | null>(null);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}`);
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
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: currentUser?.nguoi_dung_id }) 
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
             const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: currentUser?.nguoi_dung_id, ly_do: reason })
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

    const handleConfirmPayment = async () => {
        if (!window.confirm("Xác nhận khách đã thanh toán đầy đủ số tiền này?")) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: currentUser?.nguoi_dung_id })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success("Đơn hàng đã hoàn tất!");
            fetchOrder();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (reason: string) => {
        // if (!user) return toast.error("Vui lòng đăng nhập.");

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: currentUser?.nguoi_dung_id || 1, ly_do_huy: reason })
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
        formData.append("nhan_vien_id", String(currentUser?.nguoi_dung_id || 1));
        
        if (data.anh_minh_chung) {
            for (let i = 0; i < data.anh_minh_chung.length; i++) {
                formData.append('anh_minh_chung', data.anh_minh_chung[i]);
            }
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/handover`, {
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
        formData.append("nhan_vien_id", String(currentUser?.nguoi_dung_id || 1));

        if (data.anh_minh_chung) {
            for (let i = 0; i < data.anh_minh_chung.length; i++) {
                formData.append('anh_minh_chung', data.anh_minh_chung[i]);
            }
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/return`, {
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
    setIsSubmitting(true);
    try {
  
        const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/confirm-deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nhan_vien_id: currentUser?.nguoi_dung_id || 1 })
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
    if (!order) return;

    const tong_phu_phi = data.phi_hu_hong + data.phi_tre + data.chi_phi_khac;

    const d1 = new Date(order.ngay_bat_dau);
    const d2 = new Date(order.ngay_ket_thuc);
    const soNgay = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    
    const tamTinh = order.gia_thue * soNgay;
    const tienGiam = tamTinh * order.ty_le_giam;
    const tienThueGoc = tamTinh - tienGiam;

    const tong_tien_cuoi_cung = tienThueGoc + tong_phu_phi - order.tien_coc_yeu_cau;

    const ghiChuChiTiet = [
        data.ghi_chu_quyet_toan,
        data.phi_tre > 0 ? `Trễ: ${data.phi_tre.toLocaleString('vi-VN')}đ` : null,
        data.phi_hu_hong > 0 ? `Hư hỏng: ${data.phi_hu_hong.toLocaleString('vi-VN')}đ` : null,
        data.chi_phi_khac > 0 ? `Khác: ${data.chi_phi_khac.toLocaleString('vi-VN')}đ` : null
    ].filter(Boolean).join(' | ');

    const body = {
        nhan_vien_id: currentUser?.nguoi_dung_id || 1,
        tong_tien_phat_sinh: tong_phu_phi,    // Để tạo log thanh toán phụ phí
        ghi_chu_quyet_toan: ghiChuChiTiet,    // Để lưu ghi chú
        tong_tien_cuoi_cung: tong_tien_cuoi_cung // Để update giá chốt đơn
    };

    setIsSubmitting(true);
    try {
        
        const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/settle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        toast.success("Đã chốt quyết toán. Vui lòng thu tiền khách hàng!");
        setIsFinalizeModalOpen(false); 
        fetchOrder(); 
    } catch (err: any) {
        toast.error(`Lỗi: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
};

    const showRecordDetails = (type: 'giao' | 'tra') => {
        if (!order) return;

        if (type === 'giao' && order.giao_so_km) {
            setRecordModalData({
                title: "Chi Tiết Bàn Giao Xe",
                km: order.giao_so_km,
                fuel: order.giao_muc_xang,
                notes: order.giao_ghi_chu,
                imageUrls: order.giao_anh ? JSON.parse(order.giao_anh) : []
            });
            setIsRecordModalOpen(true);
        }

        if (type === 'tra' && order.tra_so_km) {
            setRecordModalData({
                title: "Chi Tiết Trả Xe",
                km: order.tra_so_km,
                fuel: order.tra_muc_xang,
                notes: order.tra_ghi_chu,
                imageUrls: order.tra_anh ? JSON.parse(order.tra_anh) : []
            });
            setIsRecordModalOpen(true);
        }
    };

     const renderActionButtons = () => {
        if (!order) return null;
        const isWaitingPayment = order.ghi_chu && order.ghi_chu.includes('[WAITING_PAYMENT]');

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
        case 'CHO_QUYET_TOAN': 
            if (isWaitingPayment) {
                return (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', width: '100%'}}>
                        <div style={{
                            padding: '10px', background: '#fff7e6', border: '1px solid #ffa940', 
                            borderRadius: '4px', color: '#d46b08', textAlign: 'center', fontWeight: 'bold'
                        }}>
                            ⚠️ Đang chờ khách thanh toán: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.tong_tien -order.tien_coc_yeu_cau)}
                        </div>
                        <button 
                            className="button-primary" 
                            style={{backgroundColor: '#52c41a'}}
                            onClick={handleConfirmPayment} 
                            disabled={isSubmitting}
                        >
                            💸 Xác nhận Đã Thu Tiền
                        </button>
                    </div>
                );
            } else {
                return (
                    <button 
                        className="button-primary" 
                        style={{backgroundColor: '#faad14'}} 
                        onClick={() => setIsFinalizeModalOpen(true)} 
                        disabled={isSubmitting}
                    >
                        💰 Quyết Toán Đơn
                    </button>
                );
            }
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
    const trangThaiDaKetThuc = ['DA_TRA', 'CHO_THANH_TOAN', 'HOAN_TAT'];

    const ngayBatDau = new Date(order.ngay_bat_dau);
    const ngayKetThuc = new Date(order.ngay_ket_thuc);
    const soNgayThue = Math.ceil((ngayKetThuc.getTime() - ngayBatDau.getTime()) / (1000 * 60 * 60 * 24));

    const tamTinh = order.gia_thue* soNgayThue;
    const tienGiamGia = tamTinh * order.ty_le_giam;
    const tienThueDuKien = tamTinh - tienGiamGia;

    const phuPhi = order.tong_tien - tienThueDuKien;
    const coPhatSinh = Math.abs(phuPhi) > 1000 && trangThaiDaKetThuc.includes(order.trang_thai);

    const tongTienHienThi = coPhatSinh ? order.tong_tien : tienThueDuKien;
    const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                            {/* 1. GIÁ THUÊ */}
                            <div className="fi-row">
                                <span>Giá thuê:</span>
                                <span>{formatCurrency(order.gia_thue)} x {soNgayThue} ngày</span>
                            </div>

                            {/* 2. TẠM TÍNH */}
                            <div className="fi-row subtotal">
                                <span>Tạm tính:</span>
                                <span>{formatCurrency(tamTinh)}</span>
                            </div>

                            {/* 3. KHUYẾN MÃI */}
                            {tienGiamGia > 0 && (
                                <div className="fi-row discount">
                                    <span>Khuyến mãi ({order.ten_chinh_sach} -{order.ty_le_giam * 100}%):</span>
                                    <span>-{formatCurrency(tienGiamGia)}</span>
                                </div>
                            )}

                            {/* <hr className="fi-divider" />

                            <div className="fi-row total">
                                <span>Tiền thuê dự kiến (đã trừ {formatCurrency(order.tien_coc_yeu_cau)} tiền cọc):</span>
                                <span style={{fontSize: '1.4rem', color: '#007bff'}}>{formatCurrency(tienThueDuKien - order.tien_coc_yeu_cau)}</span>
                            </div> */}

                            {/* 4. PHỤ PHÍ / HƯ HỎNG / TRỄ (MỚI THÊM) */}
                            {coPhatSinh && (
                                <div className="fi-row surcharge" style={{color: phuPhi > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold'}}>
                                    <span>Phí phát sinh (Hư hỏng/Trễ):</span>
                                    <span>{phuPhi > 0 ? '+' : ''}{formatCurrency(phuPhi)}</span>
                                </div>
                            )}

                            <hr className="fi-divider" />

                            {/* 5. TỔNG TIỀN */}
                            <div className="fi-row total">
                            <span>
                                {/* Đổi nhãn hiển thị cho hợp lý */}
                                {trangThaiDaKetThuc.includes(order.trang_thai) ? 'Tổng quyết toán:' : 'Tổng tiền thuê dự kiến:'} (đã trừ {formatCurrency(order.tien_coc_yeu_cau)} tiền cọc)
                            </span>
                            <span style={{fontSize: '1.4rem', color: '#007bff'}}>
                                {formatCurrency(tongTienHienThi - order.tien_coc_yeu_cau)}
                            </span>
                        </div>


                            {coPhatSinh && order.ghi_chu && (
                                <div style={{marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.85rem', color: '#856404'}}>
                                    <strong>Chi tiết:</strong> {order.ghi_chu.replace('[WAITING_PAYMENT] |', '')}
                                </div>
                            )}

                            <div className="fi-row" style={{marginTop: '15px'}}>
                                <span>Tiền cọc đã giữ:</span>
                                <span>{formatCurrency(order.tien_coc_yeu_cau)}</span>
                            </div>
                        </div>
                    </div>


                     {(order.giao_so_km || order.tra_so_km) && (
                        <div className="info-card">
                            <h2>Biên Bản Giao Nhận</h2>
                            <div className="record-buttons">
                                {order.giao_so_km && (
                                    <button className="button-secondary" onClick={() => showRecordDetails('giao')}>
                                        Xem chi tiết bàn giao
                                    </button>
                                )}
                                {order.tra_so_km && (
                                    <button className="button-secondary" onClick={() => showRecordDetails('tra')}>
                                        Xem chi tiết trả xe
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* CỘT BÊN PHẢI: THÔNG TIN PHỤ & HÀNH ĐỘNG */}
                <div className="sidebar-content">
                    <div className="info-card">
                        <h2><FaCalendarAlt /> Thời gian thuê</h2>
                        <div className="time-info">
                            <p style={{ marginBottom: '8px' }}>
                                <strong>Bắt đầu:</strong><br />
                                <span style={{ color: '#2c3e50' }}>{formatDateTime(order.ngay_bat_dau)}</span>
                            </p>
                            <p style={{ marginBottom: '8px' }}>
                                <strong>Kết thúc:</strong><br />
                                <span style={{ color: '#2c3e50' }}>{formatDateTime(order.ngay_ket_thuc)}</span>
                            </p>
                            <hr style={{ border: '0.5px solid #eee', margin: '10px 0' }} />
                            <p><strong>Tổng cộng:</strong> {soNgayThue} ngày</p>
                        </div>
                    </div>

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

                    {order.duong_dan_file && (
                        <div className="info-card" style={{ marginTop: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                            
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#111827' }}>
                                Hợp Đồng Thuê Xe
                            </h3>

                            <button 
                                onClick={() => window.open(order.duong_dan_file, '_blank')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                            >
                                <span>📄</span>
                                <span>Xem Hợp Đồng (PDF)</span>
                            </button>

                        </div>
                    )}

                    {order.trang_thai === 'DA_DUYET' && (
                        <div className="info-card">
                            <h2>Tình Trạng Thanh Toán</h2>
                            <p>
                                <strong>Tiền cọc:</strong> 
                                <span className={`status-badge status-${order.trang_thai_coc}`} style={{color: 'black'}}>
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
                initialKm={order?.so_km_xe || 0}
                />
                <HandoverModal 
                isOpen={isHandoverModalOpen}
                onClose={() => setIsHandoverModalOpen(false)}
                onSubmit={handleHandover}
                isSubmitting={isSubmitting}
                initialKm={order?.so_km_xe || 0}
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
                <VehicleRecordModal
                    isOpen={isRecordModalOpen}
                    onClose={() => setIsRecordModalOpen(false)}
                    data={recordModalData}
                />
            </div>
        </div>
    );
};

export default OrderDetail;