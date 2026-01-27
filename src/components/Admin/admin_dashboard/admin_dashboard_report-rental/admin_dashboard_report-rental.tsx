import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_dashboard_report-rental.css'
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';

type ReportType = 'time' | 'customer' | 'vehicle' | 'location' | 'status' | 'finance' | null;

interface DonThueData {
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

interface KhachHangData {
    khach_hang_id: number;
    nguoi_dung_id: number;
    ho_ten: string;
    ngay_sinh: string;
    dia_chi: string;
    thanh_pho: string;
    tinh: string;
    ma_buu_chinh: string;
    quoc_gia: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
    avatar: string;
    img: string;
}

interface PhuongTienData {
    phuong_tien_id: number;
    ten_phuong_tien: string;
    loai: string;
    danh_muc_id: number;
    trang_thai: string;
    bien_so: string;
    so_km: number;
    chinh_sach_id: number;
    so_khung: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
    img: string;
    gia_thue: number;
    model: string;
}

const AdminDashboardReportRental = () => {
    const navigate = useNavigate();
    const [selectedReport, setSelectedReport] = useState<ReportType>(null);
    const [donThueData, setDonThueData] = useState<DonThueData[]>([]);
    const [khachHangData, setKhachHangData] = useState<KhachHangData[]>([]);
    const [phuongTienData, setPhuongTienData] = useState<PhuongTienData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Gọi API để lấy dữ liệu đơn thuê
    const fetchDonThueData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://r2-api.sharkeatrice.workers.dev/api/don-thue-data');
            const result = await response.json();
            
            if (result.success) {
                setDonThueData(result.data);
            } else {
                setError(result.error || 'Không thể lấy dữ liệu');
            }
        } catch (err) {
            setError('Lỗi kết nối API');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Gọi API để lấy dữ liệu khách hàng
    const fetchKhachHangData = async () => {
        try {
            const response = await fetch('https://r2-api.sharkeatrice.workers.dev/api/khach-hang');
            const result = await response.json();
            
            if (result.success) {
                setKhachHangData(result.data);
            } else {
                console.error('Không thể lấy dữ liệu khách hàng:', result.error);
            }
        } catch (err) {
            console.error('Lỗi kết nối API khách hàng:', err);
        }
    };

    // Gọi API để lấy dữ liệu phương tiện
    const fetchPhuongTienData = async () => {
        try {
            const response = await fetch('https://r2-api.sharkeatrice.workers.dev/api/phuong-tien');
            const result = await response.json();
            
            if (result.success) {
                setPhuongTienData(result.data);
            } else {
                console.error('Không thể lấy dữ liệu phương tiện:', result.error);
            }
        } catch (err) {
            console.error('Lỗi kết nối API phương tiện:', err);
        }
    };

    useEffect(() => {
        fetchDonThueData();
        fetchKhachHangData();
        fetchPhuongTienData();
    }, []);

    const handleReportSelect = (reportType: ReportType) => {
        setSelectedReport(reportType);
    };

    const handleViewReport = () => {
        if (selectedReport === 'time') {
            navigate('/admin/AdminReportingOverTime', { state: { donThueData } });
        } else if (selectedReport === 'customer') {
            navigate('/admin/AdminReportingCustomer', { state: { donThueData, khachHangData } });
        } else if (selectedReport === 'vehicle') {
            navigate('/admin/AdminReportingVehicle', { state: { donThueData, phuongTienData } });
        } else if (selectedReport === 'location') {
            navigate('/admin/AdminReportingLocation', { state: { donThueData } });
        } else if (selectedReport === 'status') {
            navigate('/admin/AdminReportingStatus', { state: { donThueData } });
        } else if (selectedReport === 'finance') {
            navigate('/admin/AdminReportingFinance', { state: { donThueData } });
        } else if (selectedReport) {
            console.log(`Viewing ${selectedReport} report with data:`, donThueData);
            // Các báo cáo khác sẽ làm sau
        }
    };

    const reportOptions = [
        {
            type: 'time' as ReportType,
            title: 'Báo cáo theo thời gian',
            description: 'Phân tích xu hướng đơn thuê theo ngày, tuần, tháng',
            icon: 'fa-calendar-alt',
            features: ['Biểu đồ đường theo thời gian', 'So sánh các khoảng thời gian', 'Xu hướng tăng trưởng']
        },
        {
            type: 'customer' as ReportType,
            title: 'Báo cáo theo khách hàng',
            description: 'Thống kê hoạt động thuê phương tiện của từng khách hàng',
            icon: 'fa-users',
            features: ['Top khách hàng VIP', 'Tần suất thuê phương tiện', 'Giá trị đơn hàng trung bình']
        },
        {
            type: 'vehicle' as ReportType,
            title: 'Báo cáo theo phương tiện',
            description: 'Hiệu suất và tỷ lệ sử dụng của từng loại phương tiện',
            icon: 'fa-car',
            features: ['phương tiện được thuê nhiều nhất', 'Tỷ lệ sử dụng', 'Doanh thu theo loại phương tiện']
        },
        {
            type: 'location' as ReportType,
            title: 'Báo cáo theo địa điểm',
            description: 'Phân tích theo khu vực nhận và trả phương tiện',
            icon: 'fa-map-marker-alt',
            features: ['Địa điểm hot nhất', 'Phân bố địa lý', 'Khoảng cách di chuyển']
        },
        {
            type: 'status' as ReportType,
            title: 'Báo cáo theo trạng thái',
            description: 'Thống kê trạng thái đơn thuê và tỷ lệ thành công',
            icon: 'fa-chart-pie',
            features: ['Tỷ lệ hoàn thành', 'Đơn bị hủy', 'Thời gian xử lý']
        },
        {
            type: 'finance' as ReportType,
            title: 'Báo cáo tài chính',
            description: 'Phân tích doanh thu, lợi nhuận và chi phí',
            icon: 'fa-dollar-sign',
            features: ['Doanh thu theo thời gian', 'Tiền cọc và thanh toán', 'Phân tích lợi nhuận']
        }
    ];

    return (
        <div className="admin-report-rental">
            <div className="admin-report-container">
                {/* Header */}
                <div className="admin-report-header">
                    <div className="admin-report-title">
                        <h1>Báo cáo Đơn thuê</h1>
                        <p>Phân tích chi tiết và thống kê đơn thuê phương tiện</p>
                    </div>
                    <div className="admin-report-stats">
                        <div className="stat-item">
                            <span className="stat-number">{donThueData.length}</span>
                            <span className="stat-label">Tổng đơn thuê</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">
                                {donThueData.filter(item => item.trang_thai === 'active').length}
                            </span>
                            <span className="stat-label">Đang hoạt động</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">
                                {donThueData.reduce((sum, item) => sum + item.tong_tien, 0).toLocaleString('vi-VN')} VNĐ
                            </span>
                            <span className="stat-label">Tổng doanh thu</span>
                        </div>
                    </div>
                </div>

                {/* Loading & Error States */}
                {loading && (
                    <div className="loading-state">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <i className="fa-solid fa-exclamation-triangle"></i>
                        <p>Lỗi: {error}</p>
                        <Sub_Button content="Thử lại" onClick={fetchDonThueData} />
                    </div>
                )}

                {/* Report Menu */}
                {!loading && !error && (
                    <>
                        <div className="admin-report-menu">
                            <h2>Chọn loại báo cáo</h2>
                            <div className="report-grid">
                                {reportOptions.map((option) => (
                                    <div
                                        key={option.type}
                                        className={`report-card ${selectedReport === option.type ? 'selected' : ''}`}
                                        onClick={() => handleReportSelect(option.type)}
                                    >
                                        <div className="report-card-icon">
                                            <i className={`fa-solid ${option.icon}`}></i>
                                        </div>
                                        <div className="report-card-content">
                                            <h3>{option.title}</h3>
                                            <p>{option.description}</p>
                                            <ul>
                                                {option.features.map((feature, index) => (
                                                    <li key={index}>{feature}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Section */}
                        {selectedReport && (
                            <div className="report-action">
                                <div className="report-action-content">
                                    <h3>
                                        {reportOptions.find(opt => opt.type === selectedReport)?.title} đã được chọn
                                    </h3>
                                    <p>Dữ liệu đã sẵn sàng với {donThueData.length} đơn thuê. Nhấn nút bên dưới để xem biểu đồ chi tiết.</p>
                                    <div className="action-buttons">
                                        <Sub_Button 
                                            content="Xem biểu đồ chi tiết" 
                                            onClick={handleViewReport} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardReportRental;