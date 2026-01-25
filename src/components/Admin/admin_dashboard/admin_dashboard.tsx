import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './../../../styles/pages/Admin/AdminDashBoard.css';
import Sub_Button from './../../Button/Sub-Button/Sub-Button';

type ReportType = 'rental' | 'contract' | null;

const AdminDashboard = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType>(null);
    const navigate = useNavigate();

    const handleReportSelect = (reportType: ReportType) => {
        setSelectedReport(reportType);
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-container">
                <div className="admin-dashboard-header">
                    <div className="admin-dashboard-title">
                        <h1>Dashboard Quản Trị</h1>
                        <p>Xem và phân tích báo cáo hệ thống</p>
                    </div>
                    <div className="admin-dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fa-solid fa-car"></i>
                            </div>
                            <div className="stat-info">
                                <h3>156</h3>
                                <p>Đơn thuê</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fa-solid fa-file-contract"></i>
                            </div>
                            <div className="stat-info">
                                <h3>89</h3>
                                <p>Hợp đồng</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fa-solid fa-chart-line"></i>
                            </div>
                            <div className="stat-info">
                                <h3>24.5M</h3>
                                <p>Doanh thu</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-dashboard-menu">
                    <h2>Chọn loại báo cáo</h2>
                    <div className="report-menu-grid">
                        <div 
                            className={`report-menu-item ${selectedReport === 'rental' ? 'selected' : ''}`}
                            onClick={() => handleReportSelect('rental')}
                        >
                            <div className="report-menu-icon">
                                <i className="fa-solid fa-chart-bar"></i>
                            </div>
                            <div className="report-menu-content">
                                <h3>Báo cáo Đơn thuê</h3>
                                <p>Thống kê và phân tích các đơn thuê phương tiện theo thời gian, loại phương tiện và khu vực</p>
                                <ul>
                                    <li>Số lượng đơn thuê theo ngày/tháng</li>
                                    <li>Phân tích theo loại phương tiện</li>
                                    <li>Tỷ lệ thành công/hủy đơn</li>
                                </ul>
                            </div>
                        </div>

                        <div 
                            className={`report-menu-item ${selectedReport === 'contract' ? 'selected' : ''}`}
                            onClick={() => handleReportSelect('contract')}
                        >
                            <div className="report-menu-icon">
                                <i className="fa-solid fa-chart-pie"></i>
                            </div>
                            <div className="report-menu-content">
                                <h3>Báo cáo Hợp đồng</h3>
                                <p>Theo dõi tình trạng hợp đồng và hiệu suất kinh doanh</p>
                                <ul>
                                    <li>Trạng thái hợp đồng (đang thuê/hoàn thành)</li>
                                    <li>Doanh thu theo hợp đồng</li>
                                    <li>Thời gian thuê trung bình</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {selectedReport && (
                        <div className="report-actions">
                            <div className="report-actions-content">
                                <h3>
                                    {selectedReport === 'rental' ? 'Báo cáo Đơn thuê' : 'Báo cáo Hợp đồng'} đã được chọn
                                </h3>
                                <p>Nhấn nút bên dưới để xem biểu đồ chi tiết</p>
                                <div className="action-buttons">
                                    <Sub_Button 
                                        content="Xem biểu đồ chi tiết" 
                                        onClick={() => navigate("../admin_dashboard_report-rental")} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;