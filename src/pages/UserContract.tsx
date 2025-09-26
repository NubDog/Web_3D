import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import Button from '../components/Button/Button';
import { useAuth } from '../contexts/AuthContext';
import './../styles/pages/UserContract/UserContract.css';

interface Contract {
    hop_dong_id: number;
    don_thue_id: number;
    so_hop_dong: string;
    ngay_ky: string;
    nhan_vien_ky: string;
    khach_hang_ky: string;
    duong_dan_file: string;
    noi_dung_dieu_khoan: string;
    trang_thai: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
}

interface ApiResponse {
    success: boolean;
    data: Contract[];
    message: string;
    summary: {
        total_don_thue: number;
        total_hop_dong: number;
        khach_hang_id: number;
    };
    error?: string;
}

const UserContract = () => {
    const { currentUser } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/user-hop-dong';

    // Fetch contracts data
    useEffect(() => {
        const fetchContracts = async () => {
            if (!currentUser?.nguoi_dung_id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}?nguoi_dung_id=${currentUser.nguoi_dung_id}`);
                const result: ApiResponse = await response.json();

                if (result.success) {
                    setContracts(result.data);
                } else {
                    setError(result.error || 'Không thể tải danh sách hợp đồng');
                }
            } catch (err: any) {
                setError('Lỗi kết nối đến server');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContracts();
    }, [currentUser]);

    // Format date to Vietnamese format
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // Get status color and text
    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'hieu_luc':
                return { text: 'Hiệu lực', className: 'UserContract-status-active' };
            case 'expired':
            case 'het_han':
                return { text: 'Hết hạn', className: 'UserContract-status-expired' };
            case 'pending':
            case 'cho_duyet':
                return { text: 'Chờ duyệt', className: 'UserContract-status-pending' };
            case 'cancelled':
            case 'huy':
                return { text: 'Đã hủy', className: 'UserContract-status-cancelled' };
            default:
                return { text: status, className: 'UserContract-status-default' };
        }
    };

    // Handle file download
    const handleDownload = (fileUrl: string, contractNumber: string) => {
        if (fileUrl) {
            try {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = `hop-dong-${contractNumber}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Lỗi khi tải file:', error);
                // Fallback: mở file trong tab mới
                window.open(fileUrl, '_blank');
            }
        }
    };

    // Format contract number for display
    const formatContractNumber = (contractNumber: string) => {
        return contractNumber.replace(/(\d{4})(\d{2})(\d{2})(\d+)/, '$1-$2-$3-$4');
    };

    // Get contract status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'hieu_luc':
                return '✓';
            case 'expired':
            case 'het_han':
                return '⏰';
            case 'pending':
            case 'cho_duyet':
                return '⏳';
            case 'cancelled':
            case 'huy':
                return '✕';
            default:
                return '?';
        }
    };

    // If not logged in
    if (!currentUser) {
        return (
            <div className="UserContract-container">
                <Header />
                <div className="UserContract-not-logged-in">
                    <div className="UserContract-login-prompt">
                        <h2>Vui lòng đăng nhập</h2>
                        <p>Bạn cần đăng nhập để xem danh sách hợp đồng của mình</p>
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
            <div className="UserContract-container">
                <Header />
                <div className="UserContract-loading">
                    <div className="UserContract-loading-spinner">
                        <div className="spinner"></div>
                    </div>
                    <h2>Đang tải hợp đồng...</h2>
                    <p>Vui lòng chờ trong giây lát</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="UserContract-container">
            <Header />
            <div className="UserContract-content">
                <div className="UserContract-wrapper">
                    <div className="UserContract-header">
                        <h1>Hợp đồng của tôi</h1>
                        <div className="UserContract-header-info">
                            <span className="UserContract-count">
                                {contracts.length} hợp đồng
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="UserContract-error">
                            {error}
                        </div>
                    )}

                    {contracts.length === 0 && !error ? (
                        <div className="UserContract-empty">
                            <div className="UserContract-empty-content">
                                <h3>Chưa có hợp đồng nào</h3>
                                <p>Bạn chưa có hợp đồng nào được tạo. Hãy thực hiện đặt thuê để có hợp đồng đầu tiên.</p>
                                <Link to="/store">
                                    <Button conttent="Khám phá sản phẩm" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="UserContract-grid">
                            {contracts.map((contract) => {
                                const statusInfo = getStatusInfo(contract.trang_thai);
                                return (
                                    <div key={contract.hop_dong_id} className="UserContract-card">
                                        <div className="UserContract-card-header">
                                            <div className="UserContract-card-title">
                                                <h3>Hợp đồng #{formatContractNumber(contract.so_hop_dong)}</h3>
                                                <span className={`UserContract-status ${statusInfo.className}`}>
                                                    <span className="status-icon">{getStatusIcon(contract.trang_thai)}</span>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="UserContract-card-content">
                                            <div className="UserContract-info-group">
                                                <div className="UserContract-info-item">
                                                    <label>Ngày ký</label>
                                                    <span>{formatDate(contract.ngay_ky)}</span>
                                                </div>
                                                <div className="UserContract-info-item">
                                                    <label>Đơn thuê</label>
                                                    <span>#{contract.don_thue_id}</span>
                                                </div>
                                            </div>

                                            <div className="UserContract-info-group">
                                                <div className="UserContract-info-item">
                                                    <label>Nhân viên ký</label>
                                                    <span>{contract.nhan_vien_ky}</span>
                                                </div>
                                                <div className="UserContract-info-item">
                                                    <label>Khách hàng ký</label>
                                                    <span>{contract.khach_hang_ky}</span>
                                                </div>
                                            </div>

                                            {contract.noi_dung_dieu_khoan && (
                                                <div className="UserContract-info-group">
                                                    <div className="UserContract-info-item full-width">
                                                        <label>Điều khoản</label>
                                                        <p className="UserContract-terms">
                                                            {contract.noi_dung_dieu_khoan}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="UserContract-info-group">
                                                <div className="UserContract-info-item">
                                                    <label>Ngày tạo</label>
                                                    <span>{formatDate(contract.ngay_tao)}</span>
                                                </div>
                                                <div className="UserContract-info-item">
                                                    <label>Cập nhật</label>
                                                    <span>{formatDate(contract.ngay_cap_nhat)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="UserContract-card-actions">
                                            {contract.duong_dan_file ? (
                                                <button
                                                    className="UserContract-download-btn"
                                                    onClick={() => handleDownload(contract.duong_dan_file, contract.so_hop_dong)}
                                                    title="Tải xuống file hợp đồng PDF"
                                                >
                                                    <span className="download-icon">📄</span>
                                                    Tải xuống hợp đồng
                                                </button>
                                            ) : (
                                                <div className="UserContract-no-file">
                                                    <span className="no-file-icon">📋</span>
                                                    <span>Chưa có file hợp đồng</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default UserContract;