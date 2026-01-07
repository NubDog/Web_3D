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
    hop_dong_url?: string;
    trang_thai_hop_dong?: string;
    ten_phuong_tien?: string;

    gia_thue: number;
    ty_le_giam: number;
    ten_chinh_sach?: string;

    trang_thai_coc?: string;
    ngay_duyet_coc?: string;
}

const AccountOrder = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<DonThue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State cho Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DonThue | null>(null);
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
    const [now, setNow] = useState(new Date().getTime())

    const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'FINAL'>('DEPOSIT');

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/user-orders';

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date().getTime());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser?.nguoi_dung_id) { setIsLoading(false); return; }
            try {
                const response = await fetch(`${API_URL}?nguoi_dung_id=${currentUser.nguoi_dung_id}&t=${new Date().getTime()}`);
                const result = await response.json();
                if (result.success) {
                    setOrders(result.data);
                    if (selectedOrder && showPaymentModal) {
                        const updated = result.data.find((o: DonThue) => o.don_thue_id === selectedOrder.don_thue_id);
                        if (updated) {
                            // Nếu đang cọc mà thấy trạng thái đổi khác DA_DUYET -> Đóng
                            if (paymentType === 'DEPOSIT' && updated.trang_thai !== 'DA_DUYET') setShowPaymentModal(false);
                            // Nếu đang quyết toán mà thấy trạng thái HOAN_THANH -> Đóng
                            if (paymentType === 'FINAL' && updated.trang_thai === 'HOAN_THANH') setShowPaymentModal(false);
                        }
                    }
                } else setError(result.error || 'Lỗi tải đơn');
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [currentUser, selectedOrder, showPaymentModal, paymentType]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

    // đồng hồ đếm ngược
    // Đồng hồ đếm ngược
    const renderCountdown = (order: DonThue) => {
        // 🔥 KIỂM TRA ĐIỀU KIỆN CHÍNH XÁC
        const status = order.trang_thai?.toUpperCase();
        const depositStatus = order.trang_thai_coc?.toUpperCase();

        // Chỉ hiển thị khi: DA_DUYET + CHO_THANH_TOAN (chưa cọc)
        if (status !== 'DA_DUYET' || depositStatus !== 'CHO_THANH_TOAN') {
            return null;
        }

        // 🔥 LẤY THỜI GIAN TỪ ngay_duyet_coc (giống Admin)
        const approvedTimeString = order.ngay_duyet_coc;

        if (!approvedTimeString) {
            console.warn(`Đơn #${order.don_thue_id}: Không có ngày duyệt cọc`);
            return null;
        }

        // Parse thời gian (format: "2026-01-06 18:10:00")
        const safeDateString = approvedTimeString.replace(' ', 'T');
        const approvedTime = new Date(safeDateString).getTime();

        // Kiểm tra nếu ngày không hợp lệ
        if (isNaN(approvedTime)) {
            console.error(`Đơn #${order.don_thue_id}: Ngày không hợp lệ (${approvedTimeString})`);
            return <div style={{ color: 'red', fontSize: '12px' }}>Lỗi thời gian</div>;
        }

        const deadline = approvedTime + (60 * 60 * 1000); // +60 phút
        const distance = deadline - now;

        // TRƯỜNG HỢP 1: ĐÃ HẾT GIỜ 
        if (distance <= 0) {
            return (
                <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: '#fff1f0',
                    border: '1px solid #ffa39e',
                    borderRadius: '6px',
                    color: '#cf1322',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>Đơn hàng đã quá hạn - Đang chờ hệ thống xử lý...</span>
                </div>
            );
        }

        // TRƯỜNG HỢP 2: CÒN GIỜ (HIỂN THỊ ĐỒNG HỒ) 
        const m = Math.floor(distance / 1000 / 60);
        const s = Math.floor((distance / 1000) % 60);
        const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        // Xác định màu sắc
        const isDanger = distance < 60000; // < 1 phút
        const isWarning = distance >= 60000 && distance < 15 * 60000; // 1-15 phút
        const isSafe = distance >= 15 * 60000; // > 15 phút

        return (
            <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: isDanger ? '#fff2f0' : isWarning ? '#fffbe6' : '#f6ffed',
                color: isDanger ? '#cf1322' : isWarning ? '#d48806' : '#52c41a',
                border: `1px solid ${isDanger ? '#ffccc7' : isWarning ? '#ffe58f' : '#b7eb8f'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isDanger ? 'pulse 1s infinite' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <i className="fa-regular fa-clock"></i>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {isDanger ? '⚠️ GẤP! Thanh toán ngay:' : 'Vui lòng thanh toán cọc trong:'}
                    </span>
                </div>
                <span style={{
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    fontSize: '24px',
                    letterSpacing: '2px'
                }}>
                    {timeString}
                </span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    {isDanger ? '(Đơn sắp bị hủy!)' : '(Trước khi đơn bị hủy tự động)'}
                </span>
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        let color = '#6c757d'; let text = status; let bg = '#f8f9fa';
        switch (status?.toLowerCase()) {
            case 'da_duyet': color = '#007bff'; bg = '#e7f1ff'; text = 'Đã duyệt - Chờ cọc'; break;
            case 'da_coc': color = '#198754'; bg = '#d1e7dd'; text = 'Đã cọc - Chờ nhận xe'; break;
            case 'dang_thue': color = '#0dcaf0'; bg = '#cff4fc'; text = 'Đang thuê xe'; break;
            case 'da_tra':
            case 'cho_thanh_toan': color = '#fd7e14'; bg = '#fff4e6'; text = 'Đã trả xe - Chờ thanh toán'; break;
            case 'hoan_thanh': color = '#198754'; bg = '#d1e7dd'; text = 'Hoàn thành'; break;
            case 'da_huy': color = '#dc3545'; bg = '#f8d7da'; text = 'Đã hủy'; break;
        }
        return (
            <span style={{ backgroundColor: bg, color: color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${color}20` }}>
                {text}
            </span>
        );
    };

    const handleViewContract = (url: string) => url ? window.open(url, '_blank') : alert("Hợp đồng đang tạo.");

    // Hàm mở modal thanh toán, nhận vào loại thanh toán
    const handleOpenPayment = (order: DonThue, type: 'DEPOSIT' | 'FINAL') => {
        setSelectedOrder(order);
        setPaymentType(type);
        setPaymentSubmitted(false);
        setShowPaymentModal(true);
    };

    // Tính toán số tiền cần thanh toán dựa trên loại
    const getPaymentAmount = () => {
        if (!selectedOrder) return 0;

        if (paymentType === 'DEPOSIT') {
            return selectedOrder.tien_coc_yeu_cau;
        }


        const soTienConLai = selectedOrder.tong_tien - selectedOrder.tien_coc_yeu_cau;

        return soTienConLai > 0 ? soTienConLai : 0;
    };
    const renderPaymentDetails = () => {
        // TRƯỜNG HỢP 1: THANH TOÁN QUYẾT TOÁN (Hiện chi tiết cộng trừ)
        if (paymentType === 'FINAL' && selectedOrder) {
            const d1 = new Date(selectedOrder.ngay_bat_dau);
            const d2 = new Date(selectedOrder.ngay_ket_thuc);
            const soNgay = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1;

            const giaThueGoc = (selectedOrder.gia_thue || 0) * soNgay;
            const tienGiamGia = giaThueGoc * (selectedOrder.ty_le_giam || 0);
            const tongSauGiam = giaThueGoc - tienGiamGia;


            const phiPhatSinh = selectedOrder.tong_tien - tongSauGiam;

            const canThanhToan = selectedOrder.tong_tien - selectedOrder.tien_coc_yeu_cau;
            return (
                <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666' }}>
                        <span>Giá thuê ({soNgay} ngày):</span>
                        <span>{formatCurrency(giaThueGoc)}</span>
                    </div>

                    {tienGiamGia > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#28a745' }}>
                            <span>Khuyến mãi {selectedOrder.ten_chinh_sach ? `(${selectedOrder.ten_chinh_sach})` : ''}:</span>
                            <span>-{formatCurrency(tienGiamGia)}</span>
                        </div>
                    )}

                    {Math.abs(phiPhatSinh) > 1000 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: phiPhatSinh > 0 ? '#dc3545' : '#28a745' }}>
                            <span>Phụ phí / Điều chỉnh:</span>
                            <span>{phiPhatSinh > 0 ? '+' : ''}{formatCurrency(phiPhatSinh)}</span>
                        </div>
                    )}

                    <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold' }}>
                        <span style={{ color: 'black' }}>TỔNG CỘNG:</span>
                        <span>{formatCurrency(selectedOrder.tong_tien)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#28a745' }}>
                        <span>Đã đặt cọc:</span>
                        <strong>-{formatCurrency(selectedOrder.tien_coc_yeu_cau)}</strong>
                    </div>

                    <div style={{ borderTop: '2px solid #eee', margin: '10px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                        <span style={{ color: 'black' }}>CẦN THANH TOÁN:</span>
                        <strong style={{ color: '#6610f2' }}>{formatCurrency(canThanhToan > 0 ? canThanhToan : 0)}</strong>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                <p><strong>Loại giao dịch:</strong> Đặt cọc thuê xe</p>
                <p><strong>Số tiền:</strong> <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(getPaymentAmount())}</span></p>
                <p><strong>Nội dung:</strong> {getPaymentContent()}</p>
            </div>
        );
    };

    const getPaymentContent = () => {
        if (paymentType === 'DEPOSIT') return `COC DON ${selectedOrder?.don_thue_id}`;
        return `THANH TOAN DON ${selectedOrder?.don_thue_id}`;
    };

    if (!currentUser) return (<div className="accountOrder-container"><Header /><div style={{ padding: 50, textAlign: 'center' }}>Vui lòng đăng nhập</div><Footer /></div>);
    if (isLoading) return (<div className="accountOrder-container"><Header /><div style={{ padding: 50, textAlign: 'center' }}>Đang tải...</div><Footer /></div>);

    return (
        <div className="accountOrder-container">
            <Header />
            <div className="accountOrder-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', minHeight: '60vh' }}>
                <div className="accountOrder-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '28px', color: '#333' }}>Đơn thuê của tôi</h1>
                    <Link to="/account_home" style={{ textDecoration: 'none' }}>
                        <Button conttent="Quay lại" />
                    </Link>
                </div>

                {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '20px' }}>{error}</div>}

                <div className="accountOrder-list" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {orders.map((order) => (
                        <div key={order.don_thue_id} style={{
                            backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden'
                        }}>
                            <div style={{ padding: '15px 20px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ color: '#666', marginRight: '5px' }}>Mã đơn:</span>
                                    <span style={{ fontWeight: 'bold', color: 'black' }}>#{order.don_thue_id}</span>
                                    <span style={{ margin: '0 10px', color: '#ddd' }}>|</span>
                                    <span style={{ fontSize: '13px', color: '#888' }}>Ngày: {formatDate(order.ngay_tao)}</span>
                                </div>
                                <div>{getStatusBadge(order.trang_thai)}</div>
                            </div>

                            <div style={{ padding: '25px' }}>
                                <h3 style={{ fontSize: '22px', color: '#333', marginBottom: '25px', fontWeight: '700' }}>
                                    {order.ten_phuong_tien || "Phương tiện"}
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'stretch' }}>
                                    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <span style={{ color: '#777', fontSize: '13px' }}>Thời gian: </span>
                                            <span style={{ fontWeight: '600', color: 'black' }}>{formatDate(order.ngay_bat_dau)} - {formatDate(order.ngay_ket_thuc)}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#777', fontSize: '13px' }}>Địa điểm: </span>
                                            <span style={{ fontWeight: '600', color: 'black' }}>Tại cửa hàng (Chi nhánh Đà Nẵng)</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#f8faff', padding: '15px', borderRadius: '12px', border: '1px solid #e6f0ff' }}>
                                        {(() => {
                                            const d1 = new Date(order.ngay_bat_dau);
                                            const d2 = new Date(order.ngay_ket_thuc);
                                            const soNgay = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1;

                                            const giaThueGoc = (order.gia_thue || 0) * soNgay;
                                            const tienGiam = giaThueGoc * (order.ty_le_giam || 0);
                                            const phiPhatSinh = order.tong_tien - (giaThueGoc - tienGiam);
                                            const TongTienTamThoi = order.tong_tien - tienGiam

                                            return (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                                                        <span>Giá thuê ({soNgay} ngày):</span>
                                                        <span>{formatCurrency(giaThueGoc)}</span>
                                                    </div>

                                                    {tienGiam > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: '#28a745' }}>
                                                            <span>Khuyến mãi {order.ty_le_giam ? `(-${order.ty_le_giam * 100}%)` : ''}:</span>
                                                            <span>-{formatCurrency(tienGiam)}</span>
                                                        </div>
                                                    )}
                                                    {order.trang_thai == 'DA_TRA' || order.trang_thai == 'HOAN_TAT' ?
                                                        <>
                                                            {Math.abs(phiPhatSinh) > 1000 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: phiPhatSinh > 0 ? '#dc3545' : '#28a745' }}>
                                                                    <span>Phụ phí / Điều chỉnh:</span>
                                                                    <span>{phiPhatSinh > 0 ? '+' : ''}{formatCurrency(phiPhatSinh)}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                        :
                                                        null
                                                    }

                                                    <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }}></div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ color: 'black', fontWeight: '600' }}>{order.trang_thai == 'DA_TRA' || order.trang_thai == 'HOAN_TAT' ? 'Tổng thanh toán (Chưa tính cọc):' : 'Tổng thanh toán tạm (Chưa tính cọc):'}</span>
                                                        <span style={{ fontWeight: 'bold', color: '#007bff', fontSize: '16px' }}>{order.trang_thai == 'DA_TRA' || order.trang_thai == 'HOAN_TAT' ? formatCurrency(order.tong_tien) : formatCurrency(TongTienTamThoi)}</span>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                        <span style={{ color: '#666' }}>Đã đặt cọc:</span>
                                                        <span style={{ fontWeight: 'bold', color: '#6c757d' }}>{formatCurrency(order.tien_coc_yeu_cau)}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                {renderCountdown(order)}
                            </div>

                            <div style={{
                                padding: '15px 25px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '15px', backgroundColor: '#fff', flexWrap: 'wrap'
                            }}>
                                {order.hop_dong_url && (
                                    <button onClick={() => handleViewContract(order.hop_dong_url!)}
                                        style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-file-pdf"></i> Xem Hợp Đồng
                                    </button>
                                )}

                                {(() => {
                                    const st = order.trang_thai?.toLowerCase();


                                    const isReadyToPay = order.ghi_chu && order.ghi_chu.includes('[WAITING_PAYMENT]');

                                    if (st === 'da_duyet') {
                                        return (
                                            <button onClick={() => handleOpenPayment(order, 'DEPOSIT')}
                                                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)' }}>
                                                <i className="fa-solid fa-file-signature"></i> Ký & Thanh toán cọc
                                            </button>
                                        );
                                    }

                                    if (['da_coc', 'dang_thue', 'dang_thuc_hien'].includes(st)) {
                                        return (
                                            <button disabled style={{ padding: '10px 20px', backgroundColor: '#e9ecef', color: '#28a745', border: '1px solid #28a745', borderRadius: '6px', cursor: 'not-allowed', fontWeight: 'bold', opacity: 0.8 }}>
                                                <i className="fa-solid fa-check-circle"></i> Đã đóng cọc
                                            </button>
                                        );
                                    }


                                    if (st === 'cho_thanh_toan' || (st === 'da_tra' && isReadyToPay)) {
                                        return (
                                            <button onClick={() => handleOpenPayment(order, 'FINAL')}
                                                style={{ padding: '10px 20px', backgroundColor: '#6610f2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(102, 16, 242, 0.2)', animation: 'pulse 2s infinite' }}>
                                                <i className="fa-solid fa-money-bill-wave"></i> Thanh toán quyết toán
                                            </button>
                                        );
                                    }

                                    if (st === 'da_tra' && !isReadyToPay) {
                                        return (
                                            <span style={{ color: '#fd7e14', fontWeight: '500', fontStyle: 'italic', fontSize: '13px' }}>
                                                <i className="fa-solid fa-hourglass-half"></i> Chờ Admin kiểm tra xe...
                                            </span>
                                        );
                                    }

                                    return null;
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MODAL THANH TOÁN (ĐA NĂNG) --- */}
            {showPaymentModal && selectedOrder && (
                <div className="payment-modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div className="payment-modal" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxWidth: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>✖</button>

                        {!paymentSubmitted ? (
                            <>
                                <h2 style={{ color: paymentType === 'DEPOSIT' ? '#007bff' : '#6610f2', marginBottom: '5px' }}>
                                    {paymentType === 'DEPOSIT' ? 'Thanh toán tiền cọc' : 'Thanh toán quyết toán'}
                                </h2>
                                <p style={{ fontSize: '14px', color: '#666' }}>Quét mã QR để thanh toán nhanh</p>

                                <div style={{ margin: '20px auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                                    {/* Link QR động theo số tiền */}
                                    <img src={`https://img.vietqr.io/image/MB-0385750387-compact2.png?amount=${getPaymentAmount()}&addInfo=${getPaymentContent()}&accountName=NGUYEN TRAN VIET KHOA`} alt="QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                                </div>
                                {/* 
                                <div style={{textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px'}}>
                                    <p><strong>Loại giao dịch:</strong> {paymentType === 'DEPOSIT' ? 'Đặt cọc thuê xe' : 'Thanh toán hoàn tất'}</p>
                                    <p><strong>Số tiền:</strong> <span style={{color: '#dc3545', fontWeight: 'bold', fontSize: '16px'}}>{formatCurrency(getPaymentAmount())}</span></p>
                                    <p><strong>Nội dung:</strong> {getPaymentContent()}</p>
                                </div> */}

                                {renderPaymentDetails()}


                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button onClick={() => setPaymentSubmitted(true)}
                                        style={{ padding: '12px 25px', backgroundColor: paymentType === 'DEPOSIT' ? '#28a745' : '#6610f2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                                        <i className="fa-solid fa-check"></i> Đã chuyển tiền
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '20px 0' }}>
                                <div style={{ width: '80px', height: '80px', backgroundColor: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                                    <i className="fa-solid fa-clock" style={{ fontSize: '40px', color: '#28a745' }}></i>
                                </div>
                                <h2 style={{ color: '#28a745', marginBottom: '15px' }}>Đã ghi nhận yêu cầu!</h2>
                                <p style={{ fontSize: '15px', color: '#666', marginBottom: '30px', fontWeight: '500' }}>
                                    Vui lòng đợi <strong>5 - 10 phút</strong> để Admin kiểm tra giao dịch {paymentType === 'DEPOSIT' ? 'đặt cọc' : 'quyết toán'}.
                                </p>
                                <button onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 30px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng cửa sổ</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default AccountOrder;