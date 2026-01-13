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
    tong_phi_phat: number

    khach_hang_id: number
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

    const [depositTime, setDepositTime] = useState<string | null>(null);

    const [violationWarning, setViolationWarning] = useState<{
        has_violations: boolean;
        total_violations: number;
        total_debt: number;
        violations: any[];
    } | null>(null);

    const [violationInfo, setViolationInfo] = useState<{
        level: number; // 0, 1, 2, 3
        total_debt: number;
        total_violations: number;
        violations: any[];
        message: string;
    } | null>(null);

    const [showViolationModal, setShowViolationModal] = useState(false);
    // const [showLevel2Modal, setShowLevel2Modal] = useState(false);
    // const [selectedCondition, setSelectedCondition] = useState<'extra_deposit' | 'pay_first'>('extra_deposit');

    const [violations, setViolations] = useState<any[]>([]);
    const [loadingViolations, setLoadingViolations] = useState(false);  
    const [confirmingViolationPayment, setConfirmingViolationPayment] = useState(false);
    const [violationsPaid, setViolationsPaid] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}`);
            const result = await response.json();
            if (result.success) {
                setOrder(result.data);
                if (result.data.trang_thai === 'DA_DUYET' && 
                result.data.trang_thai_coc === 'CHO_THANH_TOAN' &&
                result.data.ngay_duyet_coc) {
                
                setDepositTime(result.data.ngay_duyet_coc);
                console.log('⏰ Thời gian duyệt cọc:', result.data.ngay_duyet_coc);
            } else {
                setDepositTime(null);
                console.log('❌ Không đủ điều kiện hiển thị countdown');
            }

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
    if (order?.don_thue_id && order?.trang_thai === 'CHO_DUYET') {
        fetch(`${API_BASE_URL}/api/don-thue/${order.don_thue_id}/check-violation`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setViolationInfo(result.data);
                    console.log('🚨 Violation Check:', result.data);
                }
            })
            .catch(err => console.error('Error checking violations:', err));
    }
}, [order]);

useEffect(() => {
    console.log("🔍 Current violations:", violations);
    console.log("🔍 Violations count:", violations.length);
    console.log("🔍 Order ghi_chu:", order?.ghi_chu);
    console.log("🔍 Has PAY_FIRST:", order?.ghi_chu?.includes("CONDITION: PAY_FIRST"));
}, [violations, order]);
   
    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);


   useEffect(() => {
    if (order?.khach_hang_id) {
        console.log('🔍 Fetching violations for customer:', order.khach_hang_id);
        fetchViolations();
    }
}, [order?.khach_hang_id]);

    const fetchViolations = async () => {
    if (!order?.khach_hang_id) return;
    
    setLoadingViolations(true);
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/customers/${order.khach_hang_id}/violations?status=chua_xu_ly`
        );
        
        if (!res.ok) {
            throw new Error('Failed to fetch violations');
        }
        
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
            setViolations(data.data);
            console.log('✅ Fetched violations:', data.data);
        } else {
            console.error('❌ Invalid response format:', data);
            setViolations([]);
        }
        
    } catch (err) {
        console.error('❌ Error fetching violations:', err);
        setViolations([]);
    } finally {
        setLoadingViolations(false);
    }
}

    

    const handleConfirmViolationPayment = async () => {
    if (violations.length === 0) return;
    
    const confirmed = window.confirm(
        `Xác nhận khách hàng đã thanh toán ${violations.length} vi phạm?\n\n` +
        `Tổng: ${new Intl.NumberFormat('vi-VN').format(
            violations.reduce((sum, v) => sum + v.so_tien_phat, 0)
        )} VND`
    );
    
    if (!confirmed) return;
    
    setConfirmingViolationPayment(true);
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/don-thue/${orderId}/confirm-violation-payment`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nhanvienid: currentUser?.nguoi_dung_id || 1
                })
            }
        );
        
        const result = await response.json();
        
        if (!result.success) {
            toast.error(result.error);
            return;
        }
        
        toast.success("✅ Đã xác nhận thanh toán vi phạm!");
        
        await fetchViolations();
        await fetchOrder();
        
    } catch (err: any) {
        toast.error("Lỗi: " + err.message);
    } finally {
        setConfirmingViolationPayment(false);
    }
};


    const handleApprove = async () => {
        if (!violationInfo) {
            await approveOrder('normal');
            return;
        }

        if (violationInfo.level === 3) {
            toast.error('🚫 KHÔNG THỂ DUYỆT: Khách hàng vi phạm cấp 3. Vui lòng từ chối đơn.');
            return;
        }

        if (violationInfo.level === 2) {
            const confirmed = window.confirm(
                `⚠️ Khách hàng có ${violationInfo.total_violations} vi phạm.\n\n` +
                `Tổng nợ: ${formatCurrency(violationInfo.total_debt)}\n\n` +
                `🔴 YÊU CẦU: Khách PHẢI thanh toán vi phạm TRƯỚC KHI đặt cọc.\n\n` +
                `Tiếp tục duyệt?`
            );
            if (!confirmed) return;
        }

        await approveOrder(violationInfo?.level === 2 ? 'pay_first' : 'normal');

        if (violationInfo.level === 1) {
            const confirmed = window.confirm(
                `⚠️ Khách hàng có ${violationInfo.total_violations} vi phạm nhẹ.\n\n` +
                `Tổng nợ: ${formatCurrency(violationInfo.total_debt)}\n\n` +
                `Duyệt đơn sẽ gửi email nhắc nhở khách hàng. Tiếp tục?`
            );
            if (!confirmed) return;
        }

        await approveOrder('normal');
    };

    const approveOrder = async (conditionType: 'normal' | 'extra_deposit' | 'pay_first') => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nhan_vien_id: currentUser?.nguoi_dung_id || 1,
                    condition_type: conditionType
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success('✅ Đã duyệt đơn thành công!');
            navigate('/admin/orders/pending');
        } catch (err: any) {
            toast.error('Lỗi: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
// Đồng hồ đếm giờ
    const useCountdown = (targetDate: string | null) => {
        const [timeRemaining, setTimeRemaining] = useState<number>(0);

        useEffect(() => {
            if (!targetDate) return;

            const calculateTimeLeft = () => {
                const now = new Date().getTime();
                const target = new Date(targetDate).getTime() + (60 * 60 * 1000); // +60 phút
                const difference = target - now;
                return Math.max(0, difference);
            };

            setTimeRemaining(calculateTimeLeft());

            const interval = setInterval(() => {
                const remaining = calculateTimeLeft();
                setTimeRemaining(remaining);
                if (remaining === 0) clearInterval(interval);
            }, 1000);

            return () => clearInterval(interval);
        }, [targetDate]);

        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        return {
            minutes,
            seconds,
            isExpired: timeRemaining === 0,
            timeRemaining
        };
    };

    interface DepositCountdownProps {
    approvedTime: string | null;
    depositStatus: string | null;
}

const DepositCountdown: React.FC<DepositCountdownProps> = ({ approvedTime, depositStatus }) => {
    const { minutes, seconds, isExpired, timeRemaining } = useCountdown(approvedTime);

        if (depositStatus === 'DANG_GIU' || !approvedTime) return null;

        const getStatusClass = () => {
            const totalMinutes = timeRemaining / 60000;
            if (totalMinutes <= 5) return 'danger';
            if (totalMinutes <= 15) return 'warning';
            return 'safe';
        };

        const getStatusIcon = () => {
            const totalMinutes = timeRemaining / 60000;
            if (totalMinutes <= 5) return '🔴';
            if (totalMinutes <= 15) return '🟡';
            return '🟢';
        };

        if (isExpired) {
            return (
                <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #ffebee 0%, #ef5350 100%)',
                    border: '2px solid #c62828',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    margin: '15px 0'
                }}>
                    <span style={{ fontSize: '24px' }}>⏰</span>
                    <span style={{ fontWeight: 700, color: '#c62828', fontSize: '16px' }}>
                        Đã hết hạn cọc - Đơn sẽ tự động hủy
                    </span>
                </div>
            );
        }

        return (
            <div style={{
                margin: '20px 0',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: getStatusClass() === 'safe' 
                    ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                    : getStatusClass() === 'warning'
                    ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
                    : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                border: `2px solid ${
                    getStatusClass() === 'safe' ? '#4caf50' :
                    getStatusClass() === 'warning' ? '#ff9800' : '#f44336'
                }`,
                animation: getStatusClass() === 'danger' ? 'pulse 1s ease-in-out infinite' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>{getStatusIcon()}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                        Thời gian còn lại để thanh toán cọc:
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace' }}>
                            {String(minutes).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>phút</span>
                    </div>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: '#1a1a1a', margin: '0 5px' }}>:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace' }}>
                            {String(seconds).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>giây</span>
                    </div>
                </div>

                {minutes <= 5 && (
                    <div style={{
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        padding: '10px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#e65100',
                        marginTop: '10px',
                        fontSize: '14px'
                    }}>
                        ⚠️ Vui lòng nhắc khách hàng thanh toán cọc ngay!
                    </div>
                )}
            </div>
        );
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
        const totalCurrentDebt = violations.reduce((sum, v) => sum + v.so_tien_phat, 0);
        const totalViolationCount = violations.length; 
        
        const isPayFirst = order?.ghi_chu?.includes('[CONDITION: PAY_FIRST]');
        const DEBT_LIMIT = 1000000; 
        const COUNT_LIMIT = 2;     

        if (isPayFirst && (totalCurrentDebt >= DEBT_LIMIT || totalViolationCount >= COUNT_LIMIT)) {
            toast.error(
                `⛔ KHÔNG THỂ CỌC: Khách đang có ${totalViolationCount} vi phạm (hoặc nợ > 1tr). Yêu cầu thanh toán nợ trước!`, 
                { autoClose: 6000 }
            );
            setShowViolationModal(true); 
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/don-thue/${orderId}/confirm-deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nhan_vien_id: currentUser?.nguoi_dung_id || 1 })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                if (result.blocked_reason === 'UNPAID_VIOLATIONS') {
                    toast.error(
                        `⛔ CHẶN CỌC: Khách nợ ${new Intl.NumberFormat('vi-VN').format(result.total_debt)}đ hoặc có 2 vi phạm (Vượt mức cho phép)!`,
                        { autoClose: 5000 }
                    );
                } else {
                    toast.error(result.error);
                }
                return;
            }
            
            toast.success("✅ Đã xác nhận nhận tiền cọc thành công!");
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
    const tienGiam = tamTinh * (order.ty_le_giam/100);
    const tienThueGoc = tamTinh - tienGiam;

    const tienCocThucTe = order.tien_coc_yeu_cau/100;

    const tong_tien_cuoi_cung = tienThueGoc + tong_phu_phi;

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

    const renderViolationBanner = () => {
        if (!violationInfo || violationInfo.level === 0) return null;

        const badges = {
            1: { color: '#ffc107', icon: '⚠️', text: 'Lưu ý', bgColor: '#fff3cd', borderColor: '#ffc107' },
            2: { color: '#ff9800', icon: '🔶', text: 'Cảnh báo', bgColor: '#fff3e0', borderColor: '#ff9800' },
            3: { color: '#dc3545', icon: '🚫', text: 'Chặn', bgColor: '#ffebee', borderColor: '#dc3545' }
        };

        const badge = badges[violationInfo.level as 1 | 2 | 3];

        return (
            <div 
                style={{
                    background: badge.bgColor,
                    border: `3px solid ${badge.borderColor}`,
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    animation: violationInfo.level === 3 ? 'pulse 2s ease-in-out infinite' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '40px' }}>{badge.icon}</span>
                    <div>
                        <h3 style={{ margin: 0, color: badge.color, fontSize: '20px' }}>
                            CẤP {violationInfo.level}: {badge.text.toUpperCase()}
                        </h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                            {violationInfo.message}
                        </p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    marginTop: '15px'
                }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '15px' }}>
                        <strong>Số lần vi phạm:</strong> <span style={{ color: badge.color, fontWeight: 'bold' }}>{violationInfo.total_violations}</span>
                    </p>
                    <p style={{ margin: '0', fontSize: '16px' }}>
                        <strong>Tổng nợ vi phạm:</strong> <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '18px' }}>{formatCurrency(violationInfo.total_debt)}</span>
                    </p>
                </div>

                <button
                    onClick={() => setShowViolationModal(true)}
                    style={{
                        marginTop: '15px',
                        background: badge.color,
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        width: '100%'
                    }}
                >
                    📋 Xem chi tiết vi phạm
                </button>
            </div>
        );
    };


     const renderActionButtons = () => {
        if (!order) return null;
        const isWaitingPayment = order.ghi_chu && order.ghi_chu.includes('[WAITING_PAYMENT]');

        switch (order.trang_thai) {
            case 'CHO_DUYET':
                const canApprove = !violationInfo || violationInfo.level !== 3;
                
                return (
                    <>
                        <button 
                            className="button-approve" 
                            onClick={handleApprove} 
                            disabled={isSubmitting || !canApprove}
                            style={{
                                opacity: canApprove ? 1 : 0.5,
                                cursor: canApprove ? 'pointer' : 'not-allowed'
                            }}
                            title={!canApprove ? 'Không thể duyệt: Khách hàng vi phạm cấp 3' : ''}
                        >
                            {violationInfo?.level === 3 ? '🚫 KHÔNG THỂ DUYỆT' : (isSubmitting ? 'Đang xử lý...' : '✅ Duyệt Đơn')}
                        </button>
                        <button 
                            className="button-reject" 
                            onClick={handleReject} 
                            disabled={isSubmitting}
                        >
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
            // const d1 = new Date(order.ngay_bat_dau);
            // const d2 = new Date(order.ngay_ket_thuc);
            // const soNgay = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1;
            // const tamTinh = order.gia_thue * soNgay;
            const tienGiam = tamTinh * (order.ty_le_giam / 100);
            const tienThueGoc = tamTinh - tienGiam;
            const tienCocThucTe = tienThueGoc * (order.tien_coc_yeu_cau / 100);
            const tienConLai = order.tong_tien - tienCocThucTe;

            if (isWaitingPayment) {
                return (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', width: '100%'}}>
                        <div style={{
                            padding: '10px', background: '#fff7e6', border: '1px solid #ffa940', 
                            borderRadius: '4px', color: '#d46b08', textAlign: 'center', fontWeight: 'bold'
                        }}>
                            ⚠️ Đang chờ khách thanh toán: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tienConLai)}
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

    const tamTinh = order.gia_thue * soNgayThue;
    const tienGiamGia = tamTinh * (order.ty_le_giam / 100);
    const tienThueDuKien = tamTinh - tienGiamGia;

    const tienCocThucTe = tienThueDuKien * (order.tien_coc_yeu_cau/100);

    const phuPhi = order.tong_phi_phat || 0;
    const coPhatSinh = phuPhi > 0 && trangThaiDaKetThuc.includes(order.trang_thai);

    const tongTienHienThi = (coPhatSinh ? (tienThueDuKien + phuPhi) : tienThueDuKien) - tienCocThucTe;

    const phanTramCoc = order.tien_coc_yeu_cau;

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

             {renderViolationBanner()}
            
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
                                    <span>Khuyến mãi ({order.ten_chinh_sach} -{order.ty_le_giam}%):</span>
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
                                <div className="fi-row surcharge" style={{color: '#dc3545', fontWeight: 'bold'}}>
                                    <span>Phí phát sinh (Hư hỏng/Trễ):</span>
                                    <span>+{formatCurrency(phuPhi)}</span>
                                </div>
                            )}

                            <hr className="fi-divider" />

                            {/* 5. TỔNG TIỀN */}
                            <div className="fi-row total">
                                <span>
                                    {trangThaiDaKetThuc.includes(order.trang_thai) ? 'Tổng quyết toán:' : 'Tổng tiền thuê dự kiến:'} (đã trừ {formatCurrency(tienCocThucTe)} tiền cọc)
                                </span>
                                <span style={{fontSize: '1.4rem', color: '#007bff'}}>
                                    {formatCurrency(tongTienHienThi)}
                                </span>
                            </div>

                            {coPhatSinh && order.ghi_chu && (
                                <div style={{marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.85rem', color: '#856404'}}>
                                    <strong>Chi tiết:</strong> {order.ghi_chu.replace('[WAITING_PAYMENT] |', '')}
                                </div>
                            )}

                            <div className="fi-row" style={{marginTop: '15px'}}>
                                <span>Tiền cọc đã giữ ({phanTramCoc}%):</span>
                                <span>{formatCurrency(tienCocThucTe)}</span>
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
                        {order.trang_thai_coc === 'CHO_THANH_TOAN' && depositTime && (
                            <DepositCountdown 
                                approvedTime={depositTime}
                                depositStatus={order.trang_thai_coc}
                            />
                        )}
                        {/* CẢNH BÁO CẤP 1 - REMINDER */}
                        {order.ghi_chu && order.ghi_chu.includes('[CONDITION: REMINDER]') && (
                            <div style={{
                                background: '#fff3cd',
                                border: '2px solid #ffc107',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '15px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>⚠️</span>
                                    <strong style={{ color: '#856404' }}>LƯU Ý VI PHẠM</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                                    Khách hàng có vi phạm chưa thanh toán. Vui lòng nhắc nhở thanh toán sớm.
                                </p>
                            </div>
                        )}

                        {/* CẢNH BÁO CẤP 2 - PAY_FIRST */}
                        {order.ghi_chu && 
                            order.ghi_chu.includes('[CONDITION: PAY_FIRST]') && 
                            violations.length > 0 && (
                            <div style={{
                                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                                border: '3px solid #ff9800',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '28px' }}>🔶</span>
                                    <strong style={{ color: '#e65100', fontSize: '18px' }}>
                                        ĐIỀU KIỆN ĐẶC BIỆT - CẤP 2
                                    </strong>
                                </div>
                                
                                <p style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#d84315', fontWeight: 'bold' }}>
                                    ⚠️ Khách hàng PHẢI thanh toán vi phạm TRƯỚC KHI đặt cọc
                                </p>

                                {/* DANH SÁCH VI PHẠM */}
                                {loadingViolations ? (
                                        <p>Đang tải vi phạm...</p>
                                    ) : violations.length > 0 ? (
                                        <>
                                            {/* DANH SÁCH VI PHẠM */}
                                            <div style={{ 
                                                background: 'white', 
                                                padding: '15px', 
                                                borderRadius: '8px',
                                                marginBottom: '15px'
                                            }}>
                                                <h4 style={{ marginTop: 0, color: '#d84315' }}>
                                                    📋 Vi phạm chưa thanh toán ({violations.length})
                                                </h4>
                                                <table style={{ width: '100%', fontSize: '14px' }}>
                                                    <tbody>
                                                        {violations.map(v => (
                                                            <tr key={v.vi_pham_id} style={{ borderBottom: '1px solid #eee' }}>
                                                                <td style={{ padding: '8px 0' }}>
                                                                    <strong>{v.loai_vi_pham}</strong><br/>
                                                                    <small style={{ color: '#666' }}>
                                                                        {new Date(v.thoi_gian_xay_ra).toLocaleDateString('vi-VN')}
                                                                    </small>
                                                                </td>
                                                                <td style={{ 
                                                                    textAlign: 'right', 
                                                                    fontWeight: 'bold', 
                                                                    color: '#dc3545',
                                                                    padding: '8px 0'
                                                                }}>
                                                                    {new Intl.NumberFormat('vi-VN').format(v.so_tien_phat)} đ
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr style={{ background: '#ffebee' }}>
                                                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                                                                TỔNG PHẢI TRẢ
                                                            </td>
                                                            <td style={{ 
                                                                padding: '12px 8px',
                                                                textAlign: 'right', 
                                                                fontWeight: 'bold', 
                                                                color: '#dc3545',
                                                                fontSize: '18px'
                                                            }}>
                                                            {new Intl.NumberFormat('vi-VN').format(
                                                                violations.reduce((sum, v) => sum + v.so_tien_phat, 0)
                                                            )} đ
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                     </div>

                                    <button 
                                        className="button-primary"
                                        style={{
                                            width: '100%',
                                            background: '#ff9800',
                                            border: 'none',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            padding: '14px',
                                            cursor: confirmingViolationPayment ? 'not-allowed' : 'pointer',
                                            opacity: confirmingViolationPayment ? 0.6 : 1
                                        }}
                                        onClick={handleConfirmViolationPayment}
                                        disabled={confirmingViolationPayment}
                                    >
                                        {confirmingViolationPayment ? '⏳ Đang xử lý...' : '💳 Xác nhận đã thanh toán vi phạm'}
                                    </button>
                                </>
                            ) : violationsPaid ? (
                                <div style={{ 
                                    background: '#e8f5e9', 
                                    padding: '15px', 
                                    borderRadius: '8px',
                                    border: '2px solid #4caf50'
                                }}>
                                    <p style={{ margin: 0, color: '#2e7d32', fontWeight: 'bold' }}>
                                        ✅ Đã thanh toán hết vi phạm
                                    </p>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                        Có thể xác nhận cọc bên dưới
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* TIỀN CỌC */}
                    <p>
                        <strong>Tiền cọc:</strong> 
                        <span className={`status-badge status-${order.trang_thai_coc}`} style={{color: 'black'}}>
                            {order.trang_thai_coc === 'DANG_GIU' ? '✅ Đã Nhận Cọc' : '⏳ Chưa Nhận Cọc'}
                        </span>
                    </p>

                    {/* BUTTON XÁC NHẬN CỌC - CHỈ HIỂN THỊ KHI: */}
                    {/* 1. Chưa nhận cọc */}
                    {/* 2. KHÔNG có điều kiện PAY_FIRST HOẶC đã thanh toán hết vi phạm */}
                    {order.trang_thai_coc !== 'DANG_GIU' && (
                        <div style={{ marginTop: '15px' }}>
                            {(() => {
                                const currentDebt = violations.reduce((sum, v) => sum + v.so_tien_phat, 0);
                                const currentCount = violations.length; // Số lần vi phạm
                                const isPayFirst = order.ghi_chu?.includes('CONDITION: PAY_FIRST');
                                
                                // Điều kiện chặn hiển thị nút (Nợ >= 1tr HOẶC Số lần >= 2)
                                const isBlocked = isPayFirst && (currentDebt >= 1000000 || currentCount >= 2);

                                return (
                                    <>
                                        {/* Nút Xác nhận */}
                                        <button 
                                            className="button-primary" 
                                            style={{
                                                width: '100%', 
                                                padding: '14px', 
                                                fontSize: '16px', 
                                                fontWeight: 'bold',
                                                opacity: isBlocked ? 0.5 : 1,
                                                cursor: isBlocked ? 'not-allowed' : 'pointer',
                                                backgroundColor: isBlocked ? '#999' : '#007bff'
                                            }}
                                            onClick={handleConfirmDeposit}
                                            disabled={isSubmitting || isBlocked} 
                                        >
                                            {isSubmitting ? '⏳ Đang xử lý...' : '✅ Xác nhận nhận cọc'}
                                        </button>

                                        {/* Các thông báo cảnh báo bên dưới nút */}
                                        {isBlocked ? (
                                            // 🔴 TRƯỜNG HỢP 1: BỊ CHẶN
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px',
                                                background: '#ffebee',
                                                border: '1px solid #ef5350',
                                                borderRadius: '6px',
                                                color: '#c62828',
                                                fontSize: '13px',
                                                textAlign: 'center'
                                            }}>
                                                ⛔ <strong>CHẶN CỌC DO:</strong> 
                                                <ul style={{textAlign: 'left', margin: '5px 0 5px 20px'}}>
                                                    {currentDebt >= 1000000 && <li>Tổng nợ {formatCurrency(currentDebt)} ({'>'}= 1tr)</li>}
                                                    {currentCount >= 2 && <li>Có {currentCount} lần vi phạm ({'>'}= 2)</li>}
                                                </ul>
                                                Vui lòng thanh toán vi phạm trước!
                                            </div>
                                        ) : (
                                            // 🟢 TRƯỜNG HỢP 2: ĐƯỢC PHÉP (Châm chước)
                                            isPayFirst && currentCount > 0 && (
                                                <div style={{
                                                    marginTop: '10px',
                                                    padding: '10px',
                                                    background: '#e8f5e9',
                                                    border: '1px solid #4caf50',
                                                    borderRadius: '6px',
                                                    color: '#2e7d32',
                                                    fontSize: '13px',
                                                    textAlign: 'center'
                                                }}>
                                                    ⚠️ Khách còn 1 vi phạm nhỏ ({formatCurrency(currentDebt)}).
                                                    <br/>(Đủ điều kiện châm chước cho cọc)
                                                </div>
                                            )
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* HIỂN THỊ CẢNH BÁO NẾU CÒN VI PHẠM */}
                    {order.trang_thai_coc !== "DANG_GIU" && 
                        order.ghi_chu?.includes("CONDITION: PAY_FIRST") && 
                        violations.length > 0 && (
                        <div style={{
                            background: "#fff3cd",
                            border: "2px solid #ff9800",
                            borderRadius: "8px",
                            padding: "15px",
                            marginTop: "1rem",
                            textAlign: "center"
                        }}>
                                <p style={{margin: 0, color: "#856404", fontWeight: "bold"}}>
                                ⚠️ Phải thanh toán {violations.length} vi phạm trước khi xác nhận cọc
                                </p>
                            </div>
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