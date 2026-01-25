import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../contexts/AuthContext';
import './../UserViolations/UserViolations.css';

interface Violation {
    vi_pham_id: number;
    loai_vi_pham: string;
    mo_ta: string;
    so_tien_phat: number;
    thoi_gian_xay_ra: string;
    trang_thai: string;
    don_thue_id: number;
    duong_dan_bang_chung?: string;
}

const UserViolations: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null); 

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/user-violations';

    useEffect(() => {
        fetchViolations();
    }, [currentUser]);

    const fetchViolations = async () => {
        if (!currentUser?.nguoi_dung_id) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}?nguoi_dung_id=${currentUser.nguoi_dung_id}`);
            const result = await response.json();
            
            if (result.success) {
                setViolations(result.data);
            } else {
                setError(result.error || 'Lỗi khi tải vi phạm');
            }
        } catch (err) {
            console.error(err);
            setError('Không thể kết nối server');
        } finally {
            setIsLoading(false);
        }
    };

    const getViolationLevel = () => {
        const unpaidViolations = violations.filter(v => v.trang_thai === 'chua_xu_ly');
        const totalDebt = unpaidViolations.reduce((sum, v) => sum + v.so_tien_phat, 0);
        const totalViolations = unpaidViolations.length;

        if (totalDebt >= 2000000 || totalViolations >= 3) {
            return {
                level: 3,
                totalDebt,
                totalViolations,
                message: 'Vui lòng thanh toán toàn bộ vi phạm để có thể thuê đơn',
                title: 'CHẶN CỨNG',
                subtitle: 'Vi phạm rất nghiêm trọng - Không cho duyệt',
                gradient: 'linear-gradient(135deg, #ff4757 0%, #c0392b 100%)',
                icon: '🚫',
                allowPartialPayment: false 
            };
        }

        if (totalDebt >= 1000000 || totalViolations === 2) {
            return {
                level: 2,
                totalDebt,
                totalViolations,
                message: 'Bạn có thể thanh toán từng vi phạm để giảm cấp độ, hoặc thanh toán toàn bộ',
                title: 'CẢNH BÁO',
                subtitle: 'Vi phạm nghiêm trọng - Xem xét kỹ',
                gradient: 'linear-gradient(135deg, #FF9F1C 0%, #FF8C00 100%)',
                icon: '⚠️',
                allowPartialPayment: true  
            };
        }

        if (totalViolations > 0) {
            return {
                level: 1,
                totalDebt,
                totalViolations,
                message: 'Bạn có vi phạm chưa thanh toán. Vui lòng xử lý sớm.',
                title: 'LƯU Ý',
                subtitle: 'Vi phạm nhẹ - Cho phép duyệt',
                gradient: 'linear-gradient(135deg, #ffd93d 0%, #f39c12 100%)',
                icon: '⚡',
                allowPartialPayment: true
            };
        }

        return {
            level: 0,
            totalDebt: 0,
            totalViolations: 0,
            message: 'Không có vi phạm',
            title: 'HOÀN HẢO',
            subtitle: 'Không có vi phạm nào',
            gradient: 'linear-gradient(135deg, #6BCF7F 0%, #27ae60 100%)',
            icon: '✅',
            allowPartialPayment: false
        };
    };

    const violationLevel = getViolationLevel();
    const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const parseEvidenceImages = (evidencePath: string | undefined): string[] => {
        if (!evidencePath) return [];
        try {
            const parsed = JSON.parse(evidencePath);
            return Array.isArray(parsed) ? parsed : [evidencePath];
        } catch {
            return [evidencePath];
        }
    };

    const handleOpenPayment = (violation?: Violation) => {
        setSelectedViolation(violation || null);
        setShowPaymentModal(true);
    };

    if (!currentUser) {
        return (
            <div className="user-violations-container">
                <Header />
                <div className="empty-state">
                    <i className="fa-solid fa-user-lock"></i>
                    <h3>Vui lòng đăng nhập</h3>
                    <p>Đăng nhập để xem thông tin vi phạm của bạn</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="user-violations-container">
                <Header />
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="user-violations-container">
            <Header />
            
            <div className="violations-content">
                <div className="page-hero">
                    <div className="hero-content">
                        <h1>
                            <i className="fa-solid fa-shield-exclamation"></i>
                            Vi Phạm Của Tôi
                        </h1>
                        <p style={{color: 'white'}}>Quản lý và thanh toán các khoản vi phạm</p>
                    </div>
                    <button 
                        className="btn-back"
                        onClick={() => navigate('/account_home')}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Quay lại
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {error}
                    </div>
                )}

                {violationLevel.totalViolations > 0 && (
                    <div className="violation-level-card" style={{ background: violationLevel.gradient }}>
                        <div className="level-badge">
                            <span className="level-number">{violationLevel.level}</span>
                        </div>
                        
                        <div className="level-header">
                            <div className="level-icon">{violationLevel.icon}</div>
                            <div className="level-info">
                                <h2>CẤP ĐỘ {violationLevel.level}: {violationLevel.title}</h2>
                                <p style={{color: 'white'}}>{violationLevel.subtitle}</p>
                            </div>
                        </div>

                        <div className="level-message">
                            {violationLevel.message}
                        </div>

                        <div className="level-stats">
                            <div className="stat-item">
                                <div className="stat-icon">
                                    <i className="fa-solid fa-sack-dollar"></i>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Tổng nợ:</span>
                                    <span className="stat-value">{formatCurrency(violationLevel.totalDebt)}</span>
                                </div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <div className="stat-icon">
                                    <i className="fa-solid fa-list-ol"></i>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Số lần vi phạm:</span>
                                    <span className="stat-value">{violationLevel.totalViolations} lần</span>
                                </div>
                            </div>
                        </div>

                        {violationLevel.totalDebt > 0 && (
                            <>
                                {violationLevel.allowPartialPayment ? (
                                    <div className="payment-options">
                                        <button
                                            className="btn-pay-all"
                                            onClick={() => handleOpenPayment()}
                                        >
                                            <i className="fa-solid fa-credit-card"></i>
                                            Thanh toán tất cả ({formatCurrency(violationLevel.totalDebt)})
                                        </button>
                                        <p className="payment-hint" style={{color: 'white'}}>
                                            💡 Hoặc bạn có thể thanh toán từng vi phạm bên dưới
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        className="btn-pay-all"
                                        onClick={() => handleOpenPayment()}
                                    >
                                        <i className="fa-solid fa-credit-card"></i>
                                        Thanh toán toàn bộ vi phạm ({formatCurrency(violationLevel.totalDebt)})
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="violations-section">
                    {violations.length === 0 ? (
                        <div className="empty-state success">
                            <div className="empty-icon">✨</div>
                            <h3>Không có vi phạm</h3>
                            <p>Bạn chưa có vi phạm nào. Tiếp tục giữ vững phong độ!</p>
                        </div>
                    ) : (
                        <div className="violations-grid">
                            {violations.map((violation) => {
                                const evidenceImages = parseEvidenceImages(violation.duong_dan_bang_chung);
                                const isUnpaid = violation.trang_thai === 'chua_xu_ly';
                                
                                return (
                                    <div 
                                        key={violation.vi_pham_id}
                                        className={`violation-card ${isUnpaid ? 'unpaid' : 'paid'}`}
                                    >
                                        <div className="violation-status-badge">
                                            {isUnpaid ? (
                                                <>
                                                    <i className="fa-solid fa-circle-exclamation"></i>
                                                    Chưa thanh toán
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-circle-check"></i>
                                                    Đã thanh toán
                                                </>
                                            )}
                                        </div>

                                        <div className="violation-header">
                                            <h3>{violation.loai_vi_pham}</h3>
                                            <div className="violation-amount">
                                                {formatCurrency(violation.so_tien_phat)}
                                            </div>
                                        </div>

                                        <p className="violation-description">{violation.mo_ta}</p>

                                        <div className="violation-meta">
                                            <div className="meta-item">
                                                <i className="fa-regular fa-clock"></i>
                                                {formatDateTime(violation.thoi_gian_xay_ra)}
                                            </div>
                                            <div className="meta-item">
                                                <i className="fa-solid fa-file-lines"></i>
                                                Đơn thuê #{violation.don_thue_id}
                                            </div>
                                        </div>

                                        {evidenceImages.length > 0 && (
                                            <div className="evidence-section">
                                                <div className="evidence-title">
                                                    <i className="fa-solid fa-images"></i>
                                                    Bằng chứng ({evidenceImages.length})
                                                </div>
                                                <div className="evidence-gallery">
                                                    {evidenceImages.slice(0, 3).map((img, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="evidence-item"
                                                            onClick={() => setSelectedImage(img)}
                                                        >
                                                            <img 
                                                                src={img} 
                                                                alt={`Bằng chứng ${idx + 1}`}
                                                                className="evidence-image"
                                                            />
                                                            {idx === 2 && evidenceImages.length > 3 && (
                                                                <div className="evidence-overlay">
                                                                    +{evidenceImages.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isUnpaid && violationLevel.allowPartialPayment && (
                                            <button
                                                className="btn-pay-single"
                                                onClick={() => handleOpenPayment(violation)}
                                            >
                                                <i className="fa-solid fa-wallet"></i>
                                                Thanh toán vi phạm này ({formatCurrency(violation.so_tien_phat)})
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close"
                            onClick={() => setShowPaymentModal(false)}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <div className="modal-header">
                            <div className="modal-icon">
                                <i className="fa-solid fa-qrcode"></i>
                            </div>
                            <h2>
                                {selectedViolation 
                                    ? `Thanh toán: ${selectedViolation.loai_vi_pham}`
                                    : 'Thanh toán Tất cả Vi phạm'
                                }
                            </h2>
                            <p>Quét mã QR để thanh toán nhanh chóng</p>
                        </div>

                        <div className="qr-container">
                            <img 
                                src={`https://img.vietqr.io/image/MB-0385750387-compact2.png?amount=${
                                    selectedViolation 
                                        ? selectedViolation.so_tien_phat 
                                        : violationLevel.totalDebt
                                }&addInfo=VIPHAM ${
                                    selectedViolation 
                                        ? selectedViolation.vi_pham_id 
                                        : currentUser.nguoi_dung_id
                                }&accountName=NGUYEN TRAN VIET KHOA`}
                                alt="QR Code"
                                className="qr-image"
                            />
                        </div>

                        <div className="payment-details" style={{color: 'black'}}>
                            <div className="detail-row">
                                <span>Số tiền:</span>
                                <strong>{formatCurrency(
                                    selectedViolation 
                                        ? selectedViolation.so_tien_phat 
                                        : violationLevel.totalDebt
                                )}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Nội dung:</span>
                                <code>
                                    VIPHAM {selectedViolation 
                                        ? selectedViolation.vi_pham_id 
                                        : currentUser.nguoi_dung_id
                                    }
                                </code>
                            </div>
                            {selectedViolation && (
                                <div className="detail-row">
                                    <span>Loại vi phạm:</span>
                                    <strong>{selectedViolation.loai_vi_pham}</strong>
                                </div>
                            )}
                        </div>

                        <div className="hotline-notice">
                            <div className="notice-icon">
                                <i className="fa-solid fa-phone-volume"></i>
                            </div>
                            <div className="notice-content">
                                <strong>Lưu ý quan trọng</strong>
                                <p>
                                    Sau khi thanh toán vi phạm xong, vui lòng liên hệ đến hotline 
                                    <a href="tel:0123456789"> 0123 456 789 </a>
                                    để xác nhận thanh toán vi phạm.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedImage && (
                <div className="image-preview-modal" onClick={() => setSelectedImage(null)}>
                    <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="image-preview-close"
                            onClick={() => setSelectedImage(null)}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <img src={selectedImage} alt="Preview" />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default UserViolations;
