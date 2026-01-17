import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../css/Admin_order.css';

interface PendingOrder {
    don_thue_id: number;
    ngay_tao: string;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    tong_tien: number;
    ho_ten: string;
    ten_phuong_tien: string;
    khach_hang_id: number;
    trang_thai: string
}

interface ViolationInfo {
    has_violations: boolean;
    total_violations: number;
    total_debt: number;
    latest_violation_type: string;
}

// Tiếng "Ping" dạng Base64 (Không lo chết link)
const NOTIFICATION_SOUND = 'sound/mixkit-software-interface-remove-2576.wav';
const ITEMS_PER_PAGE = 10;

const OrderList: React.FC = () => {
    const { status } = useParams<{ status: string }>();
    const navigate = useNavigate();

    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [violations, setViolations] = useState<Record<number, ViolationInfo>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedViolation, setSelectedViolation] = useState<{
        khachHangId: number;
        hoTen: string;
        vio: ViolationInfo;
    } | null>(null);

    const [showGuideModal, setShowGuideModal] = useState(false);

    const prevOrderCountRef = useRef<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [filterDate, setFilterDate] = useState<string>('');

    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
    }, []);

    const pageTitles: { [key: string]: string } = {
        all: 'Tất Cả Đơn Hàng',
        pending: 'Đơn Hàng Chờ Duyệt',
        approved: 'Đơn Hàng Đã Duyệt',
        active: 'Đơn Hàng Đang Thuê',
        returned: 'Đơn Hàng Đã Trả (Chờ Quyết Toán)',
        completed: 'Đơn Hàng Đã Hoàn Tất',
        cancelled: 'Đơn Hàng Đã Hủy'
    };
    const title = status ? pageTitles[status] : 'Danh sách Đơn Hàng';

    const fetchOrders = useCallback(async (isBackground = false) => {
        if (!status) return;
        
        if (!isBackground) setIsLoading(true);
        
        setError(null);
        try {
            let apiUrl = `https://r2-api.sharkeatrice.workers.dev/api/orders`;
            if (status !== 'all') {
                apiUrl += `?status=${status}`;
            }

            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
               if (status === 'pending' || status === 'all') {
                    if (isBackground && result.data.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
                        const newCount = result.data.length - prevOrderCountRef.current;
                        
                        audioRef.current?.play().catch(e => console.error("Audio block:", e));
                        
                        toast.info(`🔔 Có ${newCount} đơn hàng mới vừa được tạo!`, {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            theme: "colored",
                        });
                    }
                    prevOrderCountRef.current = result.data.length;
                }

                setOrders(result.data);

            if (status === 'pending' && result.data.length > 0) {
                const uniqueCustomerIds = [...new Set(result.data.map((o: PendingOrder) => o.khach_hang_id))];

                console.log('👥 Unique customer IDs:', uniqueCustomerIds);

                try {
                    const vioUrl = `https://r2-api.sharkeatrice.workers.dev/api/violations/batch-check`;
                    console.log('🚨 Calling violation API:', vioUrl);
                    console.log('📤 Sending data:', { khach_hang_ids: uniqueCustomerIds });

                    const vioResponse = await fetch(vioUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ khach_hang_ids: uniqueCustomerIds })
                    });

                    const vioResult = await vioResponse.json();
                    console.log('✅ Violation result:', vioResult);

                    if (vioResult.success) {
                        setViolations(vioResult.data);
                        console.log('📊 Violations set:', vioResult.data);
                    } else {
                        console.error('❌ Violation API returned error:', vioResult.error);
                    }
                } catch (vioErr) {
                    console.error('❌ Failed to fetch violations:', vioErr);
                }
            } else {
                console.log('⚠️ Skipping violation check (not pending page or no orders)');
            }
        } else {
                throw new Error(result.error || 'Không thể tải danh sách đơn hàng.');
            }
        } catch (err: any) {
            console.error('❌ Error fetching orders:', err);
            if (!isBackground) setError(err.message); 
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [status]);
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = 
                order.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.ten_phuong_tien.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesDate = true;
            if (filterDate) {
                const orderDate = new Date(order.ngay_tao).toLocaleDateString('en-CA'); 
                matchesDate = orderDate === filterDate;
            }

            return matchesSearch && matchesDate;
        });
    }, [orders, searchTerm, filterDate]);
    const todayPendingCount = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA'); 
        return orders.filter(o => 
            (o.trang_thai === 'CHO_DUYET' || status === 'pending') && 
            new Date(o.ngay_tao).toLocaleDateString('en-CA') === todayStr
        ).length;
    }, [orders, status]);


    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const currentOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        fetchOrders(false);

        let interval: ReturnType<typeof setInterval>;;
        if (status === 'pending' || status === 'all') {
            interval = setInterval(() => {
                fetchOrders(true); 
            }, 1000); 
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchOrders, status]);

    //Hàm kiểm tra đơn mới (trong vòng 1 tiếng)
    const isNewOrder = (dateString: string) => {
        if (!dateString) return false;
            const createdDate = new Date(dateString).getTime();
            const now = new Date().getTime();
            const oneHour = 60 * 60 * 1000; 
        return (now - createdDate) < oneHour; 
    };

    

    const handleRowClick = (orderId: number) => {
        navigate(`/admin/order/${orderId}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

   const getViolationBadge = (khachHangId: number, hoTen: string) => {
    const vio = violations[khachHangId];
    
    if (!vio || !vio.has_violations) {
        return <span style={{ color: '#ccc', fontSize: '14px' }}>-</span>;
    }

    const totalDebt = vio.total_debt;
    const totalViolations = vio.total_violations;

    let badgeStyle: React.CSSProperties = {};
    let icon = '';

    if (totalDebt > 2000000 || totalViolations >= 3) {
        badgeStyle = {
            background: 'linear-gradient(135deg, #ff5252, #dc3545)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.4)',
            animation: 'pulse-danger 2s infinite'
        };
        icon = '🚫';
    } else if (totalDebt > 1000000 || totalViolations === 2) {
        badgeStyle = {
            background: 'linear-gradient(135deg, #ffb74d, #ff9800)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)'
        };
        icon = '⚠️';
    } else {
        badgeStyle = {
            background: 'linear-gradient(135deg, #ffd54f, #ffc107)',
            color: '#663c00',
            border: 'none',
            boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)'
        };
        icon = 'ℹ️';
    }

    return (
        <span
            onClick={(e) => {
                e.stopPropagation(); // Ngăn không cho click row
                setSelectedViolation({ khachHangId, hoTen, vio });
            }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                ...badgeStyle
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {icon} {totalViolations}
        </span>
    );
};


    const isOrderBlocked = (khachHangId: number) => {
        const vio = violations[khachHangId];
        if (!vio) return false;
        return vio.total_debt > 2000000 || vio.total_violations >= 3;
    };

    if (isLoading) {
        return <div className="admin-container"><p>Đang tải danh sách đơn hàng...</p></div>;
    }

    if (error) {
        return <div className="admin-container error-message"><p>Lỗi: {error}</p></div>;
    }

    const violationCount = Object.keys(violations).length;

    return (
        <div className="admin-container">
            <h1>{title} ({filteredOrders.length})</h1>

            <div
                style={{
                display: 'flex',
                gap: 20,
                marginBottom: 24,
                flexWrap: 'wrap',
                }}
            >
                <div
                style={{
                    flex: 1,
                    minWidth: 260,
                    padding: '16px 20px',
                    borderRadius: 14,
                    background:
                    'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                    color: 'white',
                    boxShadow: '0 12px 30px rgba(37,99,235,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
                >
                <div>
                    <div
                    style={{
                        fontSize: 13,
                        opacity: 0.9,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                    >
                    <span
                        style={{
                        width: 26,
                        height: 26,
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.18)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        }}
                    >
                        📅
                    </span>
                    <span>Hôm nay ({new Date().toLocaleDateString('vi-VN')})</span>
                    </div>
                    <div
                    style={{
                        fontSize: 24,
                        fontWeight: 700,
                        marginTop: 6,
                        letterSpacing: 0.3,
                    }}
                    >
                    {todayPendingCount} đơn chờ duyệt
                    </div>
                </div>
                <div
                    style={{
                    width: 44,
                    height: 44,
                    borderRadius: '999px',
                    background: 'rgba(15,23,42,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 6px 18px rgba(15,23,42,0.35)',
                    }}
                >
                    🔔
                </div>
                </div>
            </div>

            {status === 'pending' && violationCount > 0 && (
                <div className="violation-summary-banner">
                    ⚠️ <strong>{violationCount}</strong> khách hàng trong danh sách có vi phạm chưa xử lý.
                    Vui lòng kiểm tra kỹ trước khi duyệt!
                </div>
            )}

            {status === 'pending' && violationCount > 0 && (
                <div className="violation-summary-enhanced">
                    <div className="summary-header">
                        <span className="summary-icon">⚠️</span>
                        <span className="summary-title">
                            CẢNH BÁO VI PHẠM: {violationCount} khách hàng
                        </span>
                    </div>
                    <div className="summary-breakdown">
                        <div className="breakdown-item blocked">
                            <span className="item-icon">🚫</span>
                            <span className="item-count">
                                {Object.values(violations).filter(v => 
                                    v.total_debt > 2000000 || v.total_violations >= 3
                                ).length}
                            </span>
                            <span className="item-label" style={{color: 'black'}}>Bị chặn</span>
                        </div>
                        <div className="breakdown-item serious">
                            <span className="item-icon">⚠️</span>
                            <span className="item-count">
                                {Object.values(violations).filter(v => 
                                    v.total_debt > 1000000 && v.total_debt <= 2000000
                                ).length}
                            </span>
                            <span className="item-label" style={{color: 'black'}}>Cảnh báo</span>
                        </div>
                        <div className="breakdown-item minor">
                            <span className="item-icon">ℹ️</span>
                            <span className="item-count">
                                {Object.values(violations).filter(v => 
                                    v.total_debt <= 1000000 && v.total_violations < 3
                                ).length}
                            </span>
                            <span className="item-label" style={{color: 'black'}}>Nhẹ</span>
                        </div>
                    </div>
                </div>
            )}

             <div className="action-bar"
                style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                marginBottom: 18,
                flexWrap: 'wrap',
                }}
            >
                <div
                className="search-bar"
                style={{
                    display: 'flex',
                    gap: 10,
                    flex: 1,
                    minWidth: 260,
                }}
                >
                <input
                    type="text"
                    placeholder="Tìm theo tên khách, tên xe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 1px rgba(37,99,235,0.25)';
                    }}
                    onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                        setFilterDate(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                    }}
                    />
                    {filterDate && (
                    <button
                        onClick={() => setFilterDate('')}
                        style={{
                        marginLeft: 6,
                        background: '#f3f4f6',
                        border: 'none',
                        padding: '7px 10px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: 12,
                        color: '#4b5563',
                        }}
                        title="Xóa lọc ngày"
                    >
                        ✕
                    </button>
                    )}
                </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <p>Không có đơn hàng nào.</p>
            ) : (
                <>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã Đơn</th>
                                <th>Tên Khách Hàng</th>
                                <th>Tên Xe</th>
                                <th>Ngày Bắt Đầu</th>
                                <th>Tổng Tiền</th>
                                {status === 'pending' && <th className="text-center">⚠️ Vi Phạm</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.map((order) => {
                                const blocked = isOrderBlocked(order.khach_hang_id);
                                const vio = violations[order.khach_hang_id];
                                
                                let violationClass = '';
                                if (vio) {
                                    if (vio.total_debt > 2000000 || vio.total_violations >= 3) {
                                        violationClass = 'blocked';
                                    } else if (vio.total_debt > 1000000 || vio.total_violations === 2) {
                                        violationClass = 'serious';
                                    } else {
                                        violationClass = 'minor';
                                    }
                                }
                                
                                return (
                                    <tr
                                        key={order.don_thue_id}
                                        onClick={() => handleRowClick(order.don_thue_id)}
                                        className={`
                                            ${vio ? `has-violation ${violationClass}` : ''}
                                            ${blocked ? 'row-blocked' : ''}
                                        `}
                                    >
                                        <td className='text1'>
                                            #{order.don_thue_id}
                                                {status === 'pending' && isNewOrder(order.ngay_tao) && (
                                                    <span className="new-badge">MỚI</span>
                                                )}
                                        </td>
                                        <td className='text1'>
                                            {order.ho_ten}
                                            {blocked && <span className="blocked-tag">🚫 ĐÃ CHẶN</span>}
                                        </td>
                                        <td className='text1'>{order.ten_phuong_tien}</td>
                                        <td className='text1'>{formatDate(order.ngay_bat_dau)}</td>
                                        <td className='text1'>{formatCurrency(order.tong_tien)}</td>
                                        {status === 'pending' && (
                                            <td className="text-center">
                                                {getViolationBadge(order.khach_hang_id, order.ho_ten)}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>

                        
                    </table>
                    <div className="pagination">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                            Trước
                        </button>
                        <span>Trang {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                            Sau
                        </button>
                    </div>
                </>
            )}

            {/* MODAL VI PHẠM */}
            {selectedViolation && (
                <div 
                    className="violation-modal-overlay"
                    onClick={() => setSelectedViolation(null)}
                >
                    <div 
                        className="violation-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`modal-header ${
                            selectedViolation.vio.total_debt > 2000000 || selectedViolation.vio.total_violations >= 3
                                ? 'danger'
                                : selectedViolation.vio.total_debt > 1000000
                                ? 'warning'
                                : 'info'
                        }`}>
                            <div className="header-content">
                                <span className="header-icon">
                                    {selectedViolation.vio.total_debt > 2000000 || selectedViolation.vio.total_violations >= 3
                                        ? '🚫'
                                        : selectedViolation.vio.total_debt > 1000000
                                        ? '⚠️'
                                        : 'ℹ️'}
                                </span>
                                <div>
                                    <h3>CẢNH BÁO VI PHẠM</h3>
                                    <p className="customer-name">{selectedViolation.hoTen}</p>
                                </div>
                            </div>
                            <button 
                                className="close-btn"
                                onClick={() => setSelectedViolation(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            <div className="stats-grid">
                                <div className="stat-card violations">
                                    <div className="stat-icon">📋</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{selectedViolation.vio.total_violations}</div>
                                        <div className="stat-label">Vi phạm</div>
                                    </div>
                                </div>
                                <div className="stat-card debt">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-info">
                                        <div className="stat-value">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                                maximumFractionDigits: 0
                                            }).format(selectedViolation.vio.total_debt)}
                                        </div>
                                        <div className="stat-label">Tổng nợ</div>
                                    </div>
                                </div>
                            </div>

                            {/* Chi tiết */}
                            <div className="detail-section">
                                <h4>📌 Vi phạm gần nhất</h4>
                                <div className="violation-type-card">
                                    {selectedViolation.vio.latest_violation_type}
                                </div>
                            </div>

                            {/* Mức độ nghiêm trọng */}
                            <div className="severity-section">
                                <h4>🎯 Đánh giá</h4>
                                {selectedViolation.vio.total_debt > 2000000 || selectedViolation.vio.total_violations >= 3 ? (
                                    <div className="alert alert-danger">
                                        <strong>🚫 CHẶN CỨNG</strong>
                                        <p>Khách hàng có mức vi phạm nghiêm trọng. Không cho phép duyệt đơn hàng mới.</p>
                                        <ul>
                                            <li>Yêu cầu thanh toán toàn bộ nợ vi phạm</li>
                                            <li>Liên hệ bộ phận quản lý để xử lý đặc biệt</li>
                                        </ul>
                                    </div>
                                ) : selectedViolation.vio.total_debt > 1000000 ? (
                                    <div className="alert alert-warning">
                                        <strong>⚠️ CẢNH BÁO NGHIÊM TRỌNG</strong>
                                        <p>Khách hàng có vi phạm đáng lo ngại. Cần xem xét kỹ trước khi duyệt.</p>
                                        <ul>
                                            <li>Yêu cầu cọc thêm 50% tổng nợ ({new Intl.NumberFormat('vi-VN').format(selectedViolation.vio.total_debt * 0.5)} đ)</li>
                                            <li>Hoặc yêu cầu thanh toán vi phạm cũ trước</li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <strong>ℹ️ LƯU Ý</strong>
                                        <p>Khách hàng có vi phạm nhẹ. Có thể duyệt nhưng cần theo dõi.</p>
                                        <ul>
                                            <li>Nhắc nhở khách thanh toán vi phạm</li>
                                            <li>Xem xét tăng cọc nếu cần thiết</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setSelectedViolation(null)}
                            >
                                Đóng
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    navigate(`/admin/users/${selectedViolation.khachHangId}/customer-detail`);
                                }}
                            >
                                Xem chi tiết khách hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGuideModal && (
                <div 
                    className="violation-modal-overlay"
                    onClick={() => setShowGuideModal(false)}
                >
                    <div 
                        className="guide-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="guide-header">
                            <div className="guide-header-content">
                                <span className="guide-icon">📚</span>
                                <h2>HƯỚNG DẪN XÉT VI PHẠM</h2>
                            </div>
                            <button 
                                className="close-btn"
                                onClick={() => setShowGuideModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="guide-body">
                            {/* Giới thiệu */}
                            <div className="guide-intro">
                                <p>
                                    Hệ thống tự động phân loại mức độ vi phạm của khách hàng dựa trên 
                                    <strong> tổng số tiền nợ</strong> và <strong>số lần vi phạm</strong>.
                                </p>
                            </div>

                            {/* Cấp độ vi phạm */}
                            <div className="severity-levels">
                                <h3>📊 Phân loại mức độ vi phạm</h3>
                                
                                {/* Cấp độ 1: Lưu ý */}
                                <div className="severity-card info">
                                    <div className="severity-card-header">
                                        <span className="severity-icon">ℹ️</span>
                                        <div>
                                            <h4>CẤP ĐỘ 1: LƯU Ý</h4>
                                            <p className="severity-subtitle">Vi phạm nhẹ - Cho phép duyệt</p>
                                        </div>
                                    </div>
                                    <div className="severity-criteria">
                                        <div className="criteria-item">
                                            <span className="criteria-icon">💰</span>
                                            <div>
                                                <strong>Tổng nợ:</strong>
                                                <span className="criteria-value">≤ 1.000.000 đ</span>
                                            </div>
                                        </div>
                                        <div className="criteria-item">
                                            <span className="criteria-icon">📋</span>
                                            <div>
                                                <strong>Số lần:</strong>
                                                <span className="criteria-value">1-2 lần</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="severity-action">
                                        <strong>✅ Hành động:</strong>
                                        <ul>
                                            <li>Cho phép duyệt đơn hàng</li>
                                            <li>Nhắc nhở khách thanh toán vi phạm</li>
                                            <li>Theo dõi thêm nếu cần</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Cấp độ 2: Cảnh báo */}
                                <div className="severity-card warning">
                                    <div className="severity-card-header">
                                        <span className="severity-icon">⚠️</span>
                                        <div>
                                            <h4>CẤP ĐỘ 2: CẢNH BÁO</h4>
                                            <p className="severity-subtitle">Vi phạm nghiêm trọng - Xem xét kỹ</p>
                                        </div>
                                    </div>
                                    <div className="severity-criteria">
                                        <div className="criteria-item">
                                            <span className="criteria-icon">💰</span>
                                            <div>
                                                <strong>Tổng nợ:</strong>
                                                <span className="criteria-value">1.000.000 đ - 2.000.000 đ</span>
                                            </div>
                                        </div>
                                        <div className="criteria-item">
                                            <span className="criteria-icon">📋</span>
                                            <div>
                                                <strong>Số lần:</strong>
                                                <span className="criteria-value">2 lần</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="severity-action">
                                        <strong>⚠️ Hành động:</strong>
                                        <ul>
                                            <li>Cho phép duyệt <strong>có điều kiện</strong></li>
                                            <li>Yêu cầu cọc thêm <strong>50% tổng nợ</strong></li>
                                            <li>Hoặc yêu cầu thanh toán vi phạm cũ trước</li>
                                            <li>Giảm hạn mức thuê</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Cấp độ 3: Chặn */}
                                <div className="severity-card danger">
                                    <div className="severity-card-header">
                                        <span className="severity-icon">🚫</span>
                                        <div>
                                            <h4>CẤP ĐỘ 3: CHẶN CỨNG</h4>
                                            <p className="severity-subtitle">Vi phạm rất nghiêm trọng - Không cho duyệt</p>
                                        </div>
                                    </div>
                                    <div className="severity-criteria">
                                        <div className="criteria-item">
                                            <span className="criteria-icon">💰</span>
                                            <div>
                                                <strong>Tổng nợ:</strong>
                                                <span className="criteria-value danger-text">&gt; 2.000.000 đ</span>
                                            </div>
                                        </div>
                                        <div className="criteria-or">HOẶC</div>
                                        <div className="criteria-item">
                                            <span className="criteria-icon">📋</span>
                                            <div>
                                                <strong>Số lần:</strong>
                                                <span className="criteria-value danger-text">≥ 3 lần</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="severity-action">
                                        <strong>❌ Hành động:</strong>
                                        <ul>
                                            <li><strong>KHÔNG CHO PHÉP</strong> duyệt đơn hàng mới</li>
                                            <li>Yêu cầu khách thanh toán <strong>toàn bộ nợ</strong></li>
                                            <li>Liên hệ bộ phận quản lý để xử lý đặc biệt</li>
                                            <li>Xem xét đưa vào danh sách đen nếu cần</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Các loại vi phạm phổ biến */}
                            <div className="common-violations">
                                <h3>⚖️ Các loại vi phạm phổ biến</h3>
                                <div className="violations-grid">
                                    <div className="violation-type-item">
                                        <span className="vio-icon">🚦</span>
                                        <div>
                                            <strong>Vi phạm giao thông</strong>
                                            <p>Vượt đèn đỏ, đậu xe sai, không đội mũ, quá tốc độ</p>
                                            <span className="vio-fine">200k - 1tr</span>
                                        </div>
                                    </div>
                                    <div className="violation-type-item">
                                        <span className="vio-icon">⏰</span>
                                        <div>
                                            <strong>Trả xe trễ</strong>
                                            <p>Quá hạn hợp đồng</p>
                                            <span className="vio-fine">400k/ngày</span>
                                        </div>
                                    </div>
                                    <div className="violation-type-item">
                                        <span className="vio-icon">🔧</span>
                                        <div>
                                            <strong>Hư hỏng xe</strong>
                                            <p>Trầy xước, vỡ kính, tai nạn</p>
                                            <span className="vio-fine">500k - 5tr</span>
                                        </div>
                                    </div>
                                    <div className="violation-type-item">
                                        <span className="vio-icon">📄</span>
                                        <div>
                                            <strong>Thiếu giấy tờ</strong>
                                            <p>Không mang GPLX, đăng ký xe</p>
                                            <span className="vio-fine">500k - 1tr</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lưu ý quan trọng */}
                            <div className="important-notes">
                                <h3>💡 Lưu ý quan trọng</h3>
                                <div className="note-item">
                                    <span className="note-icon">🔄</span>
                                    <p>Hệ thống tự động cập nhật chay vi phạm khi có thông tin mới từ cơ quan chức năng</p>
                                </div>
                                <div className="note-item">
                                    <span className="note-icon">⏱️</span>
                                    <p>Vi phạm được tính từ ngày xảy ra đến khi khách thanh toán xong</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="guide-footer">
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowGuideModal(false)}
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
        
    );
};

export default OrderList;
