import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_reporting_finance.css';

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

const AdminReportingFinance = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const donThueData = (location.state?.donThueData || []) as DonThueData[];

    const formatCurrency = (value: number): string => {
        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toString();
    };

    // 1. Xu hướng Doanh thu & Tiền cọc theo thời gian
    const revenueDepositTrendData = useMemo(() => {
        const monthlyData: { [key: string]: { revenue: number; deposit: number } } = {};
        
        donThueData.forEach(order => {
            const date = new Date(order.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, deposit: 0 };
            }
            monthlyData[monthYear].revenue += order.tong_tien;
            monthlyData[monthYear].deposit += order.tien_coc_yeu_cau;
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            return yA - yB || mA - mB;
        });

        return [
            {
                id: 'Doanh thu',
                color: '#10b981',
                data: sortedMonths.map(m => ({ x: m, y: monthlyData[m].revenue }))
            },
            {
                id: 'Tiền cọc',
                color: '#f59e0b',
                data: sortedMonths.map(m => ({ x: m, y: monthlyData[m].deposit }))
            }
        ];
    }, [donThueData]);

    // 2. So sánh Doanh thu vs Tiền cọc (Bar)
    const revenueVsDepositData = useMemo(() => {
        const monthlyData: { [key: string]: { revenue: number; deposit: number } } = {};
        
        donThueData.forEach(order => {
            const date = new Date(order.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, deposit: 0 };
            }
            monthlyData[monthYear].revenue += order.tong_tien;
            monthlyData[monthYear].deposit += order.tien_coc_yeu_cau;
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            return yA - yB || mA - mB;
        });

        return sortedMonths.map(month => ({
            month,
            'Doanh thu': monthlyData[month].revenue,
            'Tiền cọc': monthlyData[month].deposit
        }));
    }, [donThueData]);

    // 3. Tỷ lệ phân bố Doanh thu & Tiền cọc
    const financePieData = useMemo(() => {
        const totalRevenue = donThueData.reduce((sum, o) => sum + o.tong_tien, 0);
        const totalDeposit = donThueData.reduce((sum, o) => sum + o.tien_coc_yeu_cau, 0);
        
        return [
            { id: 'Doanh thu', label: 'Doanh thu', value: totalRevenue, color: '#10b981' },
            { id: 'Tiền cọc', label: 'Tiền cọc', value: totalDeposit, color: '#f59e0b' }
        ];
    }, [donThueData]);

    // 4. Top tháng có doanh thu cao nhất
    const topRevenueMonthsData = useMemo(() => {
        const monthlyRevenue: { [key: string]: number } = {};
        
        donThueData.forEach(order => {
            const date = new Date(order.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + order.tong_tien;
        });

        return Object.entries(monthlyRevenue)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([month, revenue]) => ({
                month,
                'Doanh thu': revenue
            }));
    }, [donThueData]);

    // 5. Doanh thu trung bình mỗi đơn
    const avgRevenuePerOrderData = useMemo(() => {
        const monthlyData: { [key: string]: { total: number; count: number } } = {};
        
        donThueData.forEach(order => {
            const date = new Date(order.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { total: 0, count: 0 };
            }
            monthlyData[monthYear].total += order.tong_tien;
            monthlyData[monthYear].count += 1;
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            return yA - yB || mA - mB;
        });

        return [{
            id: 'DT TB/Đơn',
            color: '#3b82f6',
            data: sortedMonths.map(m => ({ 
                x: m, 
                y: monthlyData[m].total / monthlyData[m].count 
            }))
        }];
    }, [donThueData]);

    // 6. Tỷ lệ tiền cọc/doanh thu theo tháng
    const depositRatioData = useMemo(() => {
        const monthlyData: { [key: string]: { revenue: number; deposit: number } } = {};
        
        donThueData.forEach(order => {
            const date = new Date(order.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, deposit: 0 };
            }
            monthlyData[monthYear].revenue += order.tong_tien;
            monthlyData[monthYear].deposit += order.tien_coc_yeu_cau;
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            return yA - yB || mA - mB;
        });

        return [{
            id: 'Tỷ lệ cọc',
            color: '#8b5cf6',
            data: sortedMonths.map(m => {
                const ratio = monthlyData[m].revenue > 0 
                    ? (monthlyData[m].deposit / monthlyData[m].revenue) * 100 
                    : 0;
                return { x: m, y: ratio };
            })
        }];
    }, [donThueData]);

    const handleBack = () => navigate('/admin/admin_dashboard_report-rental');

    const stats = useMemo(() => {
        const totalRevenue = donThueData.reduce((sum, o) => sum + o.tong_tien, 0);
        const totalDeposit = donThueData.reduce((sum, o) => sum + o.tien_coc_yeu_cau, 0);
        const avgRevenue = donThueData.length > 0 ? totalRevenue / donThueData.length : 0;
        const avgDeposit = donThueData.length > 0 ? totalDeposit / donThueData.length : 0;
        const depositRatio = totalRevenue > 0 ? (totalDeposit / totalRevenue) * 100 : 0;

        return { totalRevenue, totalDeposit, avgRevenue, avgDeposit, depositRatio };
    }, [donThueData]);

    return (
        <div className="admin-reporting-finance">
            <div className="admin-reporting-finance-container">
                <div className="admin-reporting-finance-header">
                    <div className="header-left">
                        <button className="back-button" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="header-title">
                            <h1>Báo cáo Tài chính</h1>
                            <p>Phân tích doanh thu, tiền cọc và hiệu suất tài chính</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge stat-revenue">
                            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
                            <span className="stat-label">Tổng DT</span>
                        </div>
                        <div className="stat-badge stat-deposit">
                            <span className="stat-value">{formatCurrency(stats.totalDeposit)}</span>
                            <span className="stat-label">Tổng cọc</span>
                        </div>
                        <div className="stat-badge stat-avg">
                            <span className="stat-value">{formatCurrency(stats.avgRevenue)}</span>
                            <span className="stat-label">DT TB/Đơn</span>
                        </div>
                        <div className="stat-badge stat-ratio">
                            <span className="stat-value">{stats.depositRatio.toFixed(1)}%</span>
                            <span className="stat-label">Tỷ lệ cọc</span>
                        </div>
                    </div>
                </div>

                <div className="charts-grid">
                    <div className="chart-section chart-full">
                        <div className="chart-header">
                            <div className="chart-title-wrapper">
                                <i className="fa-solid fa-chart-line chart-icon trend-icon"></i>
                                <div>
                                    <h2>Xu hướng Doanh thu & Tiền cọc</h2>
                                    <p>Biến động doanh thu và tiền cọc theo thời gian</p>
                                </div>
                            </div>
                        </div>
                        <div className="chart-container chart-large">
                            <ResponsiveLine
                                data={revenueDepositTrendData}
                                margin={{ top: 50, right: 140, bottom: 60, left: 80 }}
                                xScale={{ type: 'point' }}
                                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                                curve="catmullRom"
                                axisBottom={{
                                    tickRotation: -45,
                                    legend: 'Tháng',
                                    legendOffset: 50,
                                    legendPosition: 'middle'
                                }}
                                axisLeft={{
                                    legend: 'Số tiền (VNĐ)',
                                    legendOffset: -65,
                                    legendPosition: 'middle',
                                    format: v => formatCurrency(v)
                                }}
                                pointSize={10}
                                pointColor={{ theme: 'background' }}
                                pointBorderWidth={3}
                                pointBorderColor={{ from: 'seriesColor' }}
                                enableArea={true}
                                areaOpacity={0.15}
                                useMesh={true}
                                legends={[{
                                    anchor: 'bottom-right',
                                    direction: 'column',
                                    translateX: 120,
                                    translateY: 0,
                                    itemWidth: 100,
                                    itemHeight: 24,
                                    symbolSize: 14
                                }]}
                                theme={{
                                    axis: {
                                        ticks: { text: { fill: 'var(--text-gray)' } },
                                        legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
                                    },
                                    grid: { line: { stroke: '#e5e7eb' } }
                                }}
                                tooltip={({ point }) => (
                                    <div className="chart-tooltip">
                                        <strong>{point.seriesId}</strong>
                                        <div>{point.data.xFormatted}: <span>{Number(point.data.yFormatted).toLocaleString('vi-VN')} VNĐ</span></div>
                                    </div>
                                )}
                                animate={true}
                                motionConfig="gentle"
                            />
                        </div>
                    </div>

                    <div className="charts-row">
                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-chart-column chart-icon bar-icon"></i>
                                    <div>
                                        <h2>So sánh DT & Tiền cọc</h2>
                                        <p>Doanh thu và tiền cọc theo tháng</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveBar
                                    data={revenueVsDepositData}
                                    keys={['Doanh thu', 'Tiền cọc']}
                                    indexBy="month"
                                    margin={{ top: 20, right: 130, bottom: 80, left: 80 }}
                                    padding={0.3}
                                    groupMode="grouped"
                                    colors={['#10b981', '#f59e0b']}
                                    borderRadius={10}
                                    axisBottom={{
                                        tickRotation: -45,
                                        legend: 'Tháng',
                                        legendPosition: 'middle',
                                        legendOffset: 65
                                    }}
                                    axisLeft={{
                                        legend: 'Số tiền (VNĐ)',
                                        legendPosition: 'middle',
                                        legendOffset: -65,
                                        format: v => formatCurrency(v)
                                    }}
                                    labelTextColor="#ffffff"
                                    theme={{
                                        axis: {
                                            ticks: { text: { fill: 'var(--text-gray)', fontSize: 11 } },
                                            legend: { text: { fill: 'var(--text-gray)', fontSize: 13, fontWeight: 600 } }
                                        },
                                        grid: { line: { stroke: '#e5e7eb' } }
                                    }}
                                    tooltip={({ id, value, indexValue }) => (
                                        <div className="chart-tooltip">
                                            <strong>{indexValue}</strong>
                                            <div>{id}: <span>{Number(value).toLocaleString('vi-VN')} VNĐ</span></div>
                                        </div>
                                    )}
                                    animate={true}
                                    motionConfig="gentle"
                                />
                            </div>
                        </div>

                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-chart-pie chart-icon pie-icon"></i>
                                    <div>
                                        <h2>Phân bố Tài chính</h2>
                                        <p>Tỷ lệ doanh thu và tiền cọc</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container chart-pie-container">
                                <ResponsivePie
                                    data={financePieData}
                                    margin={{ top: 40, right: 100, bottom: 40, left: 20 }}
                                    innerRadius={0.65}
                                    padAngle={3}
                                    cornerRadius={10}
                                    activeOuterRadiusOffset={14}
                                    colors={{ datum: 'data.color' }}
                                    borderWidth={3}
                                    borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                                    arcLinkLabelsTextColor="var(--text-gray)"
                                    arcLinkLabelsThickness={3}
                                    arcLinkLabelsColor={{ from: 'color' }}
                                    arcLabelsTextColor="#ffffff"
                                    theme={{
                                        labels: { text: { fontSize: 14, fontWeight: 600 } }
                                    }}
                                    tooltip={({ datum }) => (
                                        <div className="chart-tooltip">
                                            <strong>{datum.label}</strong>
                                            <div>Tổng: <span>{Number(datum.value).toLocaleString('vi-VN')} VNĐ</span></div>
                                        </div>
                                    )}
                                    animate={true}
                                    motionConfig="gentle"
                                    transitionMode="middleAngle"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="charts-row">
                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-trophy chart-icon trophy-icon"></i>
                                    <div>
                                        <h2>Top 6 Tháng DT cao</h2>
                                        <p>Các tháng có doanh thu tốt nhất</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveBar
                                    data={topRevenueMonthsData}
                                    keys={['Doanh thu']}
                                    indexBy="month"
                                    layout="horizontal"
                                    margin={{ top: 20, right: 100, bottom: 50, left: 100 }}
                                    padding={0.3}
                                    colors={['#3b82f6']}
                                    borderRadius={10}
                                    axisBottom={{
                                        legend: 'Doanh thu (VNĐ)',
                                        legendPosition: 'middle',
                                        legendOffset: 40,
                                        format: v => formatCurrency(v)
                                    }}
                                    enableLabel={true}
                                    label={d => formatCurrency(d.value as number)}
                                    labelTextColor="#ffffff"
                                    theme={{
                                        axis: {
                                            ticks: { text: { fill: 'var(--text-gray)', fontSize: 12 } },
                                            legend: { text: { fill: 'var(--text-gray)', fontSize: 13, fontWeight: 600 } }
                                        },
                                        grid: { line: { stroke: '#e5e7eb' } }
                                    }}
                                    tooltip={({ id, value, indexValue }) => (
                                        <div className="chart-tooltip">
                                            <strong>{indexValue}</strong>
                                            <div>Doanh thu: <span>{Number(value).toLocaleString('vi-VN')} VNĐ</span></div>
                                        </div>
                                    )}
                                    animate={true}
                                    motionConfig="gentle"
                                />
                            </div>
                        </div>

                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-chart-area chart-icon avg-icon"></i>
                                    <div>
                                        <h2>DT Trung bình/Đơn</h2>
                                        <p>Giá trị đơn hàng trung bình theo tháng</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveLine
                                    data={avgRevenuePerOrderData}
                                    margin={{ top: 40, right: 40, bottom: 60, left: 80 }}
                                    xScale={{ type: 'point' }}
                                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                                    curve="monotoneX"
                                    axisBottom={{
                                        tickRotation: -45,
                                        legend: 'Tháng',
                                        legendOffset: 50,
                                        legendPosition: 'middle'
                                    }}
                                    axisLeft={{
                                        legend: 'VNĐ',
                                        legendOffset: -65,
                                        legendPosition: 'middle',
                                        format: v => formatCurrency(v)
                                    }}
                                    pointSize={12}
                                    pointColor="#ffffff"
                                    pointBorderWidth={3}
                                    pointBorderColor={{ from: 'seriesColor' }}
                                    enableArea={true}
                                    areaOpacity={0.2}
                                    useMesh={true}
                                    theme={{
                                        axis: {
                                            ticks: { text: { fill: 'var(--text-gray)' } },
                                            legend: { text: { fill: 'var(--text-gray)', fontSize: 13, fontWeight: 600 } }
                                        },
                                        grid: { line: { stroke: '#e5e7eb' } }
                                    }}
                                    tooltip={({ point }) => (
                                        <div className="chart-tooltip">
                                            <strong>{point.data.xFormatted}</strong>
                                            <div>TB/Đơn: <span>{Number(point.data.yFormatted).toLocaleString('vi-VN')} VNĐ</span></div>
                                        </div>
                                    )}
                                    animate={true}
                                    motionConfig="gentle"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="chart-section chart-full">
                        <div className="chart-header">
                            <div className="chart-title-wrapper">
                                <i className="fa-solid fa-percent chart-icon percent-icon"></i>
                                <div>
                                    <h2>Tỷ lệ Tiền cọc/Doanh thu</h2>
                                    <p>Phần trăm tiền cọc so với doanh thu theo tháng</p>
                                </div>
                            </div>
                        </div>
                        <div className="chart-container chart-medium">
                            <ResponsiveLine
                                data={depositRatioData}
                                margin={{ top: 40, right: 40, bottom: 60, left: 70 }}
                                xScale={{ type: 'point' }}
                                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                                curve="natural"
                                axisBottom={{
                                    tickRotation: -45,
                                    legend: 'Tháng',
                                    legendOffset: 50,
                                    legendPosition: 'middle'
                                }}
                                axisLeft={{
                                    legend: 'Tỷ lệ (%)',
                                    legendOffset: -55,
                                    legendPosition: 'middle'
                                }}
                                pointSize={11}
                                pointColor="#ffffff"
                                pointBorderWidth={3}
                                pointBorderColor={{ from: 'seriesColor' }}
                                enableArea={true}
                                areaOpacity={0.25}
                                useMesh={true}
                                theme={{
                                    axis: {
                                        ticks: { text: { fill: 'var(--text-gray)' } },
                                        legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
                                    },
                                    grid: { line: { stroke: '#e5e7eb' } }
                                }}
                                tooltip={({ point }) => (
                                    <div className="chart-tooltip">
                                        <strong>{point.data.xFormatted}</strong>
                                        <div>Tỷ lệ: <span>{Number(point.data.yFormatted).toFixed(2)}%</span></div>
                                    </div>
                                )}
                                animate={true}
                                motionConfig="gentle"
                            />
                        </div>
                    </div>
                </div>

                <div className="action-section">
                    <Sub_Button content="Quay lại menu báo cáo" onClick={handleBack} />
                </div>
            </div>
        </div>
    );
};

export default AdminReportingFinance;
