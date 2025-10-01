import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_reporting_over_time.css';

interface DonThueData {
    don_thue_id: number;
    khach_hang_id: number;
    phuong_tien_id: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    trang_thai: string;
    tong_tien: number;
    tien_coc_yeu_cau: number;
    ngay_tao: string;
}

const AdminReportingOverTime = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const donThueData = (location.state?.donThueData || []) as DonThueData[];

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

    const ordersOverTimeData = useMemo(() => {
        const monthlyOrders: { [key: string]: number } = {};
        
        donThueData.forEach(item => {
            const date = new Date(item.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            monthlyOrders[monthYear] = (monthlyOrders[monthYear] || 0) + 1;
        });

        const sortedMonths = Object.keys(monthlyOrders).sort((a, b) => {
            const [monthA, yearA] = a.split('/').map(Number);
            const [monthB, yearB] = b.split('/').map(Number);
            return yearA - yearB || monthA - monthB;
        });

        return [{
            id: 'Đơn thuê',
            color: '#10b981',
            data: sortedMonths.map(month => ({
                x: month,
                y: monthlyOrders[month]
            }))
        }];
    }, [donThueData]);

    const revenueByMonthData = useMemo(() => {
        const monthlyRevenue: { [key: string]: number } = {};
        
        donThueData.forEach(item => {
            const date = new Date(item.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + item.tong_tien;
        });

        const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => {
            const [monthA, yearA] = a.split('/').map(Number);
            const [monthB, yearB] = b.split('/').map(Number);
            return yearA - yearB || monthA - monthB;
        });

        return sortedMonths.map(month => ({
            month,
            'Doanh thu': monthlyRevenue[month]
        }));
    }, [donThueData]);

    const revenueVsDepositData = useMemo(() => {
        const monthlyRevenue: { [key: string]: number } = {};
        const monthlyDeposit: { [key: string]: number } = {};
        
        donThueData.forEach(item => {
            const date = new Date(item.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + item.tong_tien;
            monthlyDeposit[monthYear] = (monthlyDeposit[monthYear] || 0) + item.tien_coc_yeu_cau;
        });

        const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => {
            const [monthA, yearA] = a.split('/').map(Number);
            const [monthB, yearB] = b.split('/').map(Number);
            return yearA - yearB || monthA - monthB;
        });

        return [
            {
                id: 'Doanh thu',
                color: '#f59e0b',
                data: sortedMonths.map(month => ({
                    x: month,
                    y: monthlyRevenue[month]
                }))
            },
            {
                id: 'Tiền cọc',
                color: '#8b5cf6',
                data: sortedMonths.map(month => ({
                    x: month,
                    y: monthlyDeposit[month]
                }))
            }
        ];
    }, [donThueData]);

    const handleBack = () => {
        navigate('/admin/admin_dashboard_report-rental');
    };

    return (
        <div className="admin-reporting-time">
            <div className="admin-reporting-time-container">
                <div className="admin-reporting-time-header">
                    <div className="header-left">
                        <button className="back-button" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="header-title">
                            <h1>Báo cáo theo thời gian</h1>
                            <p>Phân tích xu hướng và doanh thu theo tháng</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge">
                            <span className="stat-value">{donThueData.length}</span>
                            <span className="stat-label">Tổng đơn</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">
                                {(donThueData.reduce((sum, item) => sum + item.tong_tien, 0) / 1000000).toFixed(1)}M
                            </span>
                            <span className="stat-label">Doanh thu</span>
                        </div>
                    </div>
                </div>

                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Số lượng đơn thuê theo tháng</h2>
                        <p>Xu hướng tăng trưởng số lượng đơn thuê qua các tháng</p>
                    </div>
                    <div className="chart-container">
                        <ResponsiveLine
                            data={ordersOverTimeData}
                            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                            axisBottom={{
                                tickRotation: -45,
                                legend: 'Tháng',
                                legendOffset: 45,
                                legendPosition: 'middle'
                            }}
                            axisLeft={{
                                legend: 'Số đơn',
                                legendOffset: -45,
                                legendPosition: 'middle'
                            }}
                            pointSize={10}
                            pointBorderWidth={2}
                            enableArea={true}
                            areaOpacity={0.15}
                            useMesh={true}
                            theme={{
                                axis: {
                                    ticks: { text: { fill: '#666' } },
                                    legend: { text: { fill: '#666', fontSize: 14, fontWeight: 600 } }
                                },
                                grid: { line: { stroke: '#e5e7eb' } }
                            }}
                            tooltip={({ point }) => (
                                <div className="chart-tooltip">
                                    <strong>{point.data.xFormatted}</strong>
                                    <div>Số đơn: <span>{point.data.yFormatted}</span></div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Doanh thu theo tháng</h2>
                        <p>Tổng doanh thu từ các đơn thuê theo từng tháng</p>
                    </div>
                    <div className="chart-container">
                        <ResponsiveBar
                            data={revenueByMonthData}
                            keys={['Doanh thu']}
                            indexBy="month"
                            margin={{ top: 50, right: 130, bottom: 50, left: 80 }}
                            padding={0.3}
                            colors={['#3b82f6']}
                            borderRadius={8}
                            axisBottom={{
                                tickRotation: -45,
                                legend: 'Tháng',
                                legendPosition: 'middle',
                                legendOffset: 45
                            }}
                            axisLeft={{
                                legend: 'Doanh thu (VNĐ)',
                                legendPosition: 'middle',
                                legendOffset: -65,
                                format: (value) => formatCurrency(value)
                            }}
                            labelTextColor="#ffffff"
                            theme={{
                                axis: {
                                    ticks: { text: { fill: '#666' } },
                                    legend: { text: { fill: '#666', fontSize: 14, fontWeight: 600 } }
                                },
                                grid: { line: { stroke: '#e5e7eb' } }
                            }}
                            tooltip={({ id, value, indexValue }) => (
                                <div className="chart-tooltip">
                                    <strong>{indexValue}</strong>
                                    <div>{id}: <span>{value.toLocaleString('vi-VN')} VNĐ</span></div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="chart-section">
                    <div className="chart-header">
                        <h2>So sánh Doanh thu & Tiền cọc</h2>
                        <p>Xu hướng doanh thu và tiền cọc yêu cầu theo tháng</p>
                    </div>
                    <div className="chart-container">
                        <ResponsiveLine
                            data={revenueVsDepositData}
                            margin={{ top: 50, right: 110, bottom: 50, left: 80 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                            curve="monotoneX"
                            axisBottom={{
                                tickRotation: -45,
                                legend: 'Tháng',
                                legendOffset: 45,
                                legendPosition: 'middle'
                            }}
                            axisLeft={{
                                legend: 'Số tiền (VNĐ)',
                                legendOffset: -65,
                                legendPosition: 'middle',
                                format: (value) => formatCurrency(value)
                            }}
                            pointSize={8}
                            pointBorderWidth={2}
                            useMesh={true}
                            theme={{
                                axis: {
                                    ticks: { text: { fill: '#666' } },
                                    legend: { text: { fill: '#666', fontSize: 14, fontWeight: 600 } }
                                },
                                grid: { line: { stroke: '#e5e7eb' } }
                            }}
                            tooltip={({ point }) => (
                                <div className="chart-tooltip">
                                    <strong>{point.data.xFormatted}</strong>
                                    <div style={{ color: point.seriesColor }}>
                                        {point.seriesId}: <span>{Number(point.data.yFormatted).toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="action-section">
                    <Sub_Button content="Quay lại menu báo cáo" onClick={handleBack} />
                </div>
            </div>
        </div>
    );
};

export default AdminReportingOverTime;
