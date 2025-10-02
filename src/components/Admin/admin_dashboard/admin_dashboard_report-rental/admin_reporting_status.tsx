import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_reporting_status.css';

interface DonThueData {
    don_thue_id: number;
    khach_hang_id: number;
    phuong_tien_id: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    trang_thai: string;
    tong_tien: number;
    ngay_tao: string;
}

const AdminReportingStatus = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const donThueData = (location.state?.donThueData || []) as DonThueData[];

    // Mapping trạng thái sang tiếng Việt
    const statusLabels: { [key: string]: string } = {
        'CHO_DUYET': 'Chờ duyệt',
        'DA_DUYET': 'Đã duyệt',
        'DANG_THUE': 'Đang thuê',
        'DA_TRA': 'Đã trả',
        'HOAN_TAT': 'Hoàn tất',
        'TU_CHOI': 'Từ chối'
    };

    // Màu sắc cho từng trạng thái
    const statusColors: { [key: string]: string } = {
        'CHO_DUYET': '#f59e0b',
        'DA_DUYET': '#3b82f6',
        'DANG_THUE': '#8b5cf6',
        'DA_TRA': '#10b981',
        'HOAN_TAT': '#06b6d4',
        'TU_CHOI': '#ef4444'
    };

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

    // 1. Biểu đồ Pie - Phân bố trạng thái
    const statusDistributionData = useMemo(() => {
        const statusCount: { [key: string]: number } = {};
        
        donThueData.forEach(order => {
            const status = order.trang_thai || 'Không xác định';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        return Object.entries(statusCount).map(([status, count]) => ({
            id: statusLabels[status] || status,
            label: statusLabels[status] || status,
            value: count,
            color: statusColors[status] || '#94a3b8'
        }));
    }, [donThueData]);

    // 2. Biểu đồ Bar - Số lượng và doanh thu theo trạng thái
    const statusMetricsData = useMemo(() => {
        const statusMetrics: { [key: string]: { count: number; revenue: number } } = {};
        
        donThueData.forEach(order => {
            const status = order.trang_thai || 'Không xác định';
            if (!statusMetrics[status]) {
                statusMetrics[status] = { count: 0, revenue: 0 };
            }
            statusMetrics[status].count += 1;
            statusMetrics[status].revenue += order.tong_tien;
        });

        return Object.entries(statusMetrics).map(([status, data]) => ({
            status: statusLabels[status] || status,
            'Số đơn': data.count,
            'Doanh thu': data.revenue
        }));
    }, [donThueData]);

    // 3. Biểu đồ Line - Xu hướng trạng thái theo thời gian
    const statusTrendData = useMemo(() => {
        const monthlyStatus: { [key: string]: { [key: string]: number } } = {};
        
        donThueData.forEach(order => {
            const date = new Date(order.ngay_tao);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            const status = order.trang_thai;
            
            if (!monthlyStatus[monthYear]) {
                monthlyStatus[monthYear] = {};
            }
            monthlyStatus[monthYear][status] = (monthlyStatus[monthYear][status] || 0) + 1;
        });

        const sortedMonths = Object.keys(monthlyStatus).sort((a, b) => {
            const [monthA, yearA] = a.split('/').map(Number);
            const [monthB, yearB] = b.split('/').map(Number);
            return yearA - yearB || monthA - monthB;
        });

        const statusTypes = ['CHO_DUYET', 'DA_DUYET', 'DANG_THUE', 'DA_TRA', 'HOAN_TAT'];
        
        return statusTypes.map(status => ({
            id: statusLabels[status],
            color: statusColors[status],
            data: sortedMonths.map(month => ({
                x: month,
                y: monthlyStatus[month][status] || 0
            }))
        }));
    }, [donThueData]);

    // 4. Tỷ lệ hoàn thành
    const completionRateData = useMemo(() => {
        const total = donThueData.length;
        const completed = donThueData.filter(d => d.trang_thai === 'HOAN_TAT').length;
        const returned = donThueData.filter(d => d.trang_thai === 'DA_TRA').length;
        const active = donThueData.filter(d => d.trang_thai === 'DANG_THUE').length;
        const pending = donThueData.filter(d => d.trang_thai === 'CHO_DUYET').length;

        return [
            { category: 'Hoàn tất', value: completed, percentage: ((completed / total) * 100).toFixed(1) },
            { category: 'Đã trả', value: returned, percentage: ((returned / total) * 100).toFixed(1) },
            { category: 'Đang thuê', value: active, percentage: ((active / total) * 100).toFixed(1) },
            { category: 'Chờ duyệt', value: pending, percentage: ((pending / total) * 100).toFixed(1) }
        ];
    }, [donThueData]);

    // 5. Doanh thu theo trạng thái
    const revenueByStatusData = useMemo(() => {
        const statusRevenue: { [key: string]: number } = {};
        
        donThueData.forEach(order => {
            const status = order.trang_thai || 'Không xác định';
            statusRevenue[status] = (statusRevenue[status] || 0) + order.tong_tien;
        });

        return Object.entries(statusRevenue)
            .sort(([, a], [, b]) => b - a)
            .map(([status, revenue]) => ({
                status: statusLabels[status] || status,
                'Doanh thu': revenue
            }));
    }, [donThueData]);

    // 6. Thống kê chuyển đổi trạng thái
    const conversionFunnelData = useMemo(() => {
        const stages = [
            { name: 'Chờ duyệt', status: 'CHO_DUYET' },
            { name: 'Đã duyệt', status: 'DA_DUYET' },
            { name: 'Đang thuê', status: 'DANG_THUE' },
            { name: 'Đã trả', status: 'DA_TRA' },
            { name: 'Hoàn tất', status: 'HOAN_TAT' }
        ];

        return stages.map(stage => {
            const count = donThueData.filter(d => d.trang_thai === stage.status).length;
            return {
                stage: stage.name,
                'Số đơn': count,
                color: statusColors[stage.status]
            };
        });
    }, [donThueData]);

    const handleBack = () => {
        navigate('/admin/admin_dashboard_report-rental');
    };

    // Thống kê tổng quan
    const stats = useMemo(() => {
        const total = donThueData.length;
        const completed = donThueData.filter(d => d.trang_thai === 'HOAN_TAT').length;
        const active = donThueData.filter(d => d.trang_thai === 'DANG_THUE').length;
        const pending = donThueData.filter(d => d.trang_thai === 'CHO_DUYET').length;
        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

        return {
            total,
            completed,
            active,
            pending,
            completionRate
        };
    }, [donThueData]);

    return (
        <div className="admin-reporting-status">
            <div className="admin-reporting-status-container">
                {/* Header */}
                <div className="admin-reporting-status-header">
                    <div className="header-left">
                        <button className="back-button" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="header-title">
                            <h1>Báo cáo theo Trạng thái</h1>
                            <p>Phân tích chi tiết trạng thái và tỷ lệ chuyển đổi đơn thuê</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge stat-total">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-label">Tổng đơn</span>
                        </div>
                        <div className="stat-badge stat-pending">
                            <span className="stat-value">{stats.pending}</span>
                            <span className="stat-label">Chờ duyệt</span>
                        </div>
                        <div className="stat-badge stat-active">
                            <span className="stat-value">{stats.active}</span>
                            <span className="stat-label">Đang thuê</span>
                        </div>
                        <div className="stat-badge stat-completed">
                            <span className="stat-value">{stats.completed}</span>
                            <span className="stat-label">Hoàn tất</span>
                        </div>
                        <div className="stat-badge stat-rate">
                            <span className="stat-value">{stats.completionRate}%</span>
                            <span className="stat-label">Tỷ lệ HT</span>
                        </div>
                    </div>
                </div>

                {/* Grid Layout for Charts */}
                <div className="charts-grid">
                    {/* Biểu đồ 1 & 2: Phân bố và Số lượng */}
                    <div className="charts-row">
                        {/* Biểu đồ 1: Phân bố trạng thái (Pie) */}
                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-chart-pie chart-icon pie-icon"></i>
                                    <div>
                                        <h2>Phân bố Trạng thái</h2>
                                        <p>Tỷ lệ phần trăm các trạng thái đơn thuê</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container chart-pie-container">
                                <ResponsivePie
                                    data={statusDistributionData}
                                    margin={{ top: 40, right: 120, bottom: 40, left: 20 }}
                                    innerRadius={0.6}
                                    padAngle={2}
                                    cornerRadius={8}
                                    activeOuterRadiusOffset={12}
                                    colors={{ datum: 'data.color' }}
                                    borderWidth={2}
                                    borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                                    arcLinkLabelsSkipAngle={10}
                                    arcLinkLabelsTextColor="var(--text-gray)"
                                    arcLinkLabelsThickness={3}
                                    arcLinkLabelsColor={{ from: 'color' }}
                                    arcLabelsSkipAngle={10}
                                    arcLabelsTextColor="#ffffff"
                                    theme={{
                                        labels: { text: { fontSize: 13, fontWeight: 600 } }
                                    }}
                                    tooltip={({ datum }) => (
                                        <div className="chart-tooltip">
                                            <strong>{datum.label}</strong>
                                            <div>Số đơn: <span>{datum.value}</span></div>
                                            <div>Tỷ lệ: <span>{((datum.value / donThueData.length) * 100).toFixed(1)}%</span></div>
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
                                    transitionMode="middleAngle"
                                />
                            </div>
                        </div>

                        {/* Biểu đồ 2: Số lượng đơn theo trạng thái */}
                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-chart-column chart-icon bar-icon"></i>
                                    <div>
                                        <h2>Số lượng theo Trạng thái</h2>
                                        <p>Tổng số đơn thuê ở từng trạng thái</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveBar
                                    data={statusMetricsData}
                                    keys={['Số đơn']}
                                    indexBy="status"
                                    margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
                                    padding={0.4}
                                    valueScale={{ type: 'linear' }}
                                    colors={['#3b82f6']}
                                    borderRadius={10}
                                    axisBottom={{
                                        tickRotation: -45,
                                        legend: 'Trạng thái',
                                        legendPosition: 'middle',
                                        legendOffset: 65
                                    }}
                                    axisLeft={{
                                        legend: 'Số đơn',
                                        legendPosition: 'middle',
                                        legendOffset: -45
                                    }}
                                    enableLabel={true}
                                    label={(d) => `${d.value}`}
                                    labelTextColor="#ffffff"
                                    theme={{
                                        axis: {
                                            ticks: { text: { fill: 'var(--text-gray)', fontSize: 12 } },
                                            legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
                                        },
                                        grid: { line: { stroke: '#e5e7eb' } }
                                    }}
                                    tooltip={({ id, value, indexValue }) => (
                                        <div className="chart-tooltip">
                                            <strong>{indexValue}</strong>
                                            <div>Số đơn: <span>{value}</span></div>
                                        </div>
                                    )}
                                    animate={true}
                                    motionConfig="gentle"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Biểu đồ 3: Xu hướng theo thời gian (Full width) */}
                    <div className="chart-section chart-full">
                        <div className="chart-header">
                            <div className="chart-title-wrapper">
                                <i className="fa-solid fa-chart-line chart-icon line-icon"></i>
                                <div>
                                    <h2>Xu hướng Trạng thái theo Thời gian</h2>
                                    <p>Biến động số lượng đơn thuê theo từng trạng thái qua các tháng</p>
                                </div>
                            </div>
                        </div>
                        <div className="chart-container chart-large">
                            <ResponsiveLine
                                data={statusTrendData}
                                margin={{ top: 50, right: 180, bottom: 60, left: 60 }}
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
                                    legend: 'Số đơn',
                                    legendOffset: -45,
                                    legendPosition: 'middle'
                                }}
                                pointSize={10}
                                pointColor={{ theme: 'background' }}
                                pointBorderWidth={2}
                                pointBorderColor={{ from: 'seriesColor' }}
                                pointLabelYOffset={-12}
                                enableArea={true}
                                areaOpacity={0.1}
                                useMesh={true}
                                legends={[
                                    {
                                        anchor: 'bottom-right',
                                        direction: 'column',
                                        justify: false,
                                        translateX: 160,
                                        translateY: 0,
                                        itemsSpacing: 4,
                                        itemDirection: 'left-to-right',
                                        itemWidth: 140,
                                        itemHeight: 24,
                                        itemOpacity: 0.85,
                                        symbolSize: 14,
                                        symbolShape: 'circle'
                                    }
                                ]}
                                theme={{
                                    axis: {
                                        ticks: { text: { fill: 'var(--text-gray)' } },
                                        legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
                                    },
                                    grid: { line: { stroke: '#e5e7eb' } },
                                    legends: { text: { fill: 'var(--text-gray)', fontSize: 12 } }
                                }}
                                tooltip={({ point }) => (
                                    <div className="chart-tooltip">
                                        <strong>{point.seriesId}</strong>
                                        <div>{point.data.xFormatted}: <span>{point.data.yFormatted} đơn</span></div>
                                    </div>
                                )}
                                animate={true}
                                motionConfig="gentle"
                            />
                        </div>
                    </div>

                    {/* Biểu đồ 4 & 5: Doanh thu và Funnel */}
                    <div className="charts-row">
                        {/* Biểu đồ 4: Doanh thu theo trạng thái */}
                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-dollar-sign chart-icon revenue-icon"></i>
                                    <div>
                                        <h2>Doanh thu theo Trạng thái</h2>
                                        <p>Tổng doanh thu từ mỗi trạng thái</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveBar
                                    data={revenueByStatusData}
                                    keys={['Doanh thu']}
                                    indexBy="status"
                                    margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
                                    padding={0.4}
                                    valueScale={{ type: 'linear' }}
                                    colors={['#10b981']}
                                    borderRadius={10}
                                    axisBottom={{
                                        tickRotation: -45,
                                        legend: 'Trạng thái',
                                        legendPosition: 'middle',
                                        legendOffset: 65
                                    }}
                                    axisLeft={{
                                        legend: 'Doanh thu (VNĐ)',
                                        legendPosition: 'middle',
                                        legendOffset: -65,
                                        format: (value) => formatCurrency(value)
                                    }}
                                    enableLabel={true}
                                    label={(d) => formatCurrency(d.value as number)}
                                    labelTextColor="#ffffff"
                                    theme={{
                                        axis: {
                                            ticks: { text: { fill: 'var(--text-gray)', fontSize: 12 } },
                                            legend: { text: { fill: 'var(--text-gray)', fontSize: 14, fontWeight: 600 } }
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

                        {/* Biểu đồ 5: Conversion Funnel */}
                        <div className="chart-section chart-half">
                            <div className="chart-header">
                                <div className="chart-title-wrapper">
                                    <i className="fa-solid fa-filter chart-icon funnel-icon"></i>
                                    <div>
                                        <h2>Phễu Chuyển đổi</h2>
                                        <p>Quy trình chuyển đổi từ chờ duyệt đến hoàn tất</p>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveBar
                                    data={conversionFunnelData}
                                    keys={['Số đơn']}
                                    indexBy="stage"
                                    layout="horizontal"
                                    margin={{ top: 20, right: 100, bottom: 50, left: 120 }}
                                    padding={0.3}
                                    valueScale={{ type: 'linear' }}
                                    colors={['#8b5cf6']}
                                    borderRadius={10}
                                    axisBottom={{
                                        legend: 'Số đơn',
                                        legendPosition: 'middle',
                                        legendOffset: 40
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
                                        grid: { line: { stroke: '#e5e7eb' } }
                                    }}
                                    tooltip={({ id, value, indexValue }) => (
                                        <div className="chart-tooltip">
                                            <strong>{indexValue}</strong>
                                            <div>Số đơn: <span>{value}</span></div>
                                        </div>
                                    )}
                                    animate={true}
                                    motionConfig="gentle"
                                />
                            </div>
                        </div>
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

export default AdminReportingStatus;
