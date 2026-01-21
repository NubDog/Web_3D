import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveBar } from '@nivo/bar';
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_reporting_location.css';

interface DonThueData {
    don_thue_id: number;
    khach_hang_id: number;
    phuong_tien_id: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    dia_diem_nhan: string;
    dia_diem_tra: string;
    trang_thai: string;
    tong_tien: number;
    ngay_tao: string;
}

const AdminReportingLocation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const donThueData = (location.state?.donThueData || []) as DonThueData[];

    // Phân tích top địa điểm nhận xe
    const topPickupLocations = useMemo(() => {
        const locationCount: { [key: string]: { count: number; revenue: number } } = {};
        
        donThueData.forEach(order => {
            const loc = order.dia_diem_nhan || 'Không xác định';
            if (!locationCount[loc]) {
                locationCount[loc] = { count: 0, revenue: 0 };
            }
            locationCount[loc].count += 1;
            locationCount[loc].revenue += order.tong_tien;
        });

        return Object.entries(locationCount)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([location, data]) => ({
                location: location.length > 30 ? location.substring(0, 30) + '...' : location,
                'Số lượt': data.count,
                'Doanh thu': data.revenue
            }));
    }, [donThueData]);

    // Phân tích top địa điểm trả xe
    const topReturnLocations = useMemo(() => {
        const locationCount: { [key: string]: { count: number; revenue: number } } = {};
        
        donThueData.forEach(order => {
            const loc = order.dia_diem_tra || 'Không xác định';
            if (!locationCount[loc]) {
                locationCount[loc] = { count: 0, revenue: 0 };
            }
            locationCount[loc].count += 1;
            locationCount[loc].revenue += order.tong_tien;
        });

        return Object.entries(locationCount)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([location, data]) => ({
                location: location.length > 30 ? location.substring(0, 30) + '...' : location,
                'Số lượt': data.count,
                'Doanh thu': data.revenue
            }));
    }, [donThueData]);

    // Format số tiền
    const formatCurrency = (value: number): string => {
        if (value >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)}B`;
        } else if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    };

    const handleBack = () => {
        navigate('/admin/admin_dashboard_report-rental');
    };

    // Thống kê tổng quan
    const stats = useMemo(() => {
        const uniquePickupLocations = new Set(donThueData.map(d => d.dia_diem_nhan).filter(Boolean)).size;
        const uniqueReturnLocations = new Set(donThueData.map(d => d.dia_diem_tra).filter(Boolean)).size;
        const totalOrders = donThueData.length;
        const avgOrdersPerLocation = uniquePickupLocations > 0 ? (totalOrders / uniquePickupLocations).toFixed(1) : '0';

        return {
            uniquePickupLocations,
            uniqueReturnLocations,
            totalOrders,
            avgOrdersPerLocation
        };
    }, [donThueData]);

    return (
        <div className="admin-reporting-location">
            <div className="admin-reporting-location-container">
                {/* Header */}
                <div className="admin-reporting-location-header">
                    <div className="header-left">
                        <button className="back-button" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="header-title">
                            <h1>Báo cáo theo Địa điểm</h1>
                            <p>Phân tích địa điểm nhận và trả phương tiện phổ biến</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge">
                            <span className="stat-value">{stats.uniquePickupLocations}</span>
                            <span className="stat-label">Điểm nhận</span>
                        </div>
                        <div className="stat-badge stat-return">
                            <span className="stat-value">{stats.uniqueReturnLocations}</span>
                            <span className="stat-label">Điểm trả</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">{stats.totalOrders}</span>
                            <span className="stat-label">Tổng đơn</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">{stats.avgOrdersPerLocation}</span>
                            <span className="stat-label">ĐH TB/Điểm</span>
                        </div>
                    </div>
                </div>

                {/* Biểu đồ 1: Top địa điểm nhận xe */}
                <div className="chart-section">
                    <div className="chart-header">
                        <div className="chart-title-wrapper">
                            <i className="fa-solid fa-location-dot chart-icon pickup-icon"></i>
                            <div>
                                <h2>Top 10 Địa điểm Nhận phương tiện Phổ biến</h2>
                                <p>Xếp hạng các địa điểm khách hàng chọn nhận phương tiện nhiều nhất</p>
                            </div>
                        </div>
                    </div>
                    <div className="chart-container chart-horizontal">
                        <ResponsiveBar
                            data={topPickupLocations}
                            keys={['Số lượt']}
                            indexBy="location"
                            layout="horizontal"
                            margin={{ top: 20, right: 130, bottom: 50, left: 280 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            colors={['#3b82f6']}
                            borderRadius={12}
                            axisBottom={{
                                legend: 'Số lượt nhận phương tiện',
                                legendPosition: 'middle',
                                legendOffset: 40,
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0
                            }}
                            enableLabel={true}
                            label={(d) => `${d.value}`}
                            labelTextColor="#ffffff"
                            theme={{
                                axis: {
                                    ticks: { text: { fill: 'var(--text-gray)', fontSize: 12 } },
                                    legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
                                },
                                grid: { line: { stroke: '#e5e7eb', strokeWidth: 1 } }
                            }}
                            tooltip={({ id, value, indexValue, data }) => (
                                <div className="chart-tooltip">
                                    <strong>{indexValue}</strong>
                                    <div>Số lượt nhận: <span>{value}</span></div>
                                    <div>Doanh thu: <span>{formatCurrency((data as any)['Doanh thu'])} VNĐ</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig={{
                                mass: 1,
                                tension: 170,
                                friction: 26,
                                clamp: false,
                                precision: 0.01,
                                velocity: 0
                            }}
                        />
                    </div>
                </div>

                {/* Biểu đồ 2: Top địa điểm trả xe */}
                <div className="chart-section">
                    <div className="chart-header">
                        <div className="chart-title-wrapper">
                            <i className="fa-solid fa-map-pin chart-icon return-icon"></i>
                            <div>
                                <h2>Top 10 Địa điểm Trả phương tiện Phổ biến</h2>
                                <p>Xếp hạng các địa điểm khách hàng chọn trả phương tiện nhiều nhất</p>
                            </div>
                        </div>
                    </div>
                    <div className="chart-container chart-horizontal">
                        <ResponsiveBar
                            data={topReturnLocations}
                            keys={['Số lượt']}
                            indexBy="location"
                            layout="horizontal"
                            margin={{ top: 20, right: 130, bottom: 50, left: 280 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            colors={['#10b981']}
                            borderRadius={12}
                            axisBottom={{
                                legend: 'Số lượt trả phương tiện',
                                legendPosition: 'middle',
                                legendOffset: 40,
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0
                            }}
                            enableLabel={true}
                            label={(d) => `${d.value}`}
                            labelTextColor="#ffffff"
                            theme={{
                                axis: {
                                    ticks: { text: { fill: 'var(--text-gray)', fontSize: 12 } },
                                    legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
                                },
                                grid: { line: { stroke: '#e5e7eb', strokeWidth: 1 } }
                            }}
                            tooltip={({ id, value, indexValue, data }) => (
                                <div className="chart-tooltip">
                                    <strong>{indexValue}</strong>
                                    <div>Số lượt trả: <span>{value}</span></div>
                                    <div>Doanh thu: <span>{formatCurrency((data as any)['Doanh thu'])} VNĐ</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig={{
                                mass: 1,
                                tension: 170,
                                friction: 26,
                                clamp: false,
                                precision: 0.01,
                                velocity: 0
                            }}
                        />
                    </div>
                </div>

                {/* Action Section */}
                <div className="action-section">
                    <Sub_Button content="Quay lại menu báo cáo" onClick={handleBack} />
                </div>
            </div>
        </div>
    );
};

export default AdminReportingLocation;
