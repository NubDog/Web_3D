import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_reporting_vehicle.css';

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

const AdminReportingVehicle = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const donThueData = (location.state?.donThueData || []) as DonThueData[];
    const phuongTienData = (location.state?.phuongTienData || []) as PhuongTienData[];

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

    // Biểu đồ 1: Top 10 Phương tiện có doanh thu cao nhất
    const topVehiclesData = useMemo(() => {
        // Tính tổng doanh thu cho mỗi phương tiện
        const vehicleRevenue: { [key: number]: { name: string; revenue: number; orders: number } } = {};
        
        donThueData.forEach(order => {
            const vehicle = phuongTienData.find(pt => pt.phuong_tien_id === order.phuong_tien_id);
            if (vehicle) {
                if (!vehicleRevenue[order.phuong_tien_id]) {
                    vehicleRevenue[order.phuong_tien_id] = {
                        name: vehicle.ten_phuong_tien,
                        revenue: 0,
                        orders: 0
                    };
                }
                vehicleRevenue[order.phuong_tien_id].revenue += order.tong_tien;
                vehicleRevenue[order.phuong_tien_id].orders += 1;
            }
        });

        // Chuyển đổi thành mảng và sắp xếp theo doanh thu
        return Object.values(vehicleRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(item => ({
                vehicle: item.name,
                'Doanh thu': item.revenue,
                'Số lượt thuê': item.orders
            }));
    }, [donThueData, phuongTienData]);

    // Biểu đồ 2: Phân bố phương tiện theo trạng thái
    const vehicleStatusData = useMemo(() => {
        const statusCount: { [key: string]: number } = {};
        
        phuongTienData.forEach(vehicle => {
            const status = vehicle.trang_thai || 'Không xác định';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const statusLabels: { [key: string]: string } = {
            'SanSang': 'Sẵn sàng',
            'DangThue': 'Đang thuê',
            'BaoTri': 'Bảo trì',
            'Không xác định': 'Không xác định'
        };

        return Object.entries(statusCount).map(([status, count]) => ({
            id: statusLabels[status] || status,
            label: statusLabels[status] || status,
            value: count
        }));
    }, [phuongTienData]);

    // Biểu đồ 3: Xu hướng thuê theo thời gian của Top 5 phương tiện
    const vehicleTrendOverTime = useMemo(() => {
        // Lấy top 5 phương tiện theo doanh thu
        const vehicleRevenue: { [key: number]: number } = {};
        
        donThueData.forEach(order => {
            if (!vehicleRevenue[order.phuong_tien_id]) {
                vehicleRevenue[order.phuong_tien_id] = 0;
            }
            vehicleRevenue[order.phuong_tien_id] += order.tong_tien;
        });

        const top5VehicleIds = Object.entries(vehicleRevenue)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => parseInt(id));

        // Tạo dữ liệu cho từng phương tiện
        return top5VehicleIds.map(vehicleId => {
            const vehicle = phuongTienData.find(pt => pt.phuong_tien_id === vehicleId);
            const monthlyOrders: { [key: string]: number } = {};

            donThueData
                .filter(order => order.phuong_tien_id === vehicleId)
                .forEach(order => {
                    const date = new Date(order.ngay_tao);
                    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
                    monthlyOrders[monthYear] = (monthlyOrders[monthYear] || 0) + 1;
                });

            const sortedMonths = Object.keys(monthlyOrders).sort((a, b) => {
                const [monthA, yearA] = a.split('/').map(Number);
                const [monthB, yearB] = b.split('/').map(Number);
                return yearA - yearB || monthA - monthB;
            });

            return {
                id: vehicle?.ten_phuong_tien || `Xe ${vehicleId}`,
                data: sortedMonths.map(month => ({
                    x: month,
                    y: monthlyOrders[month]
                }))
            };
        });
    }, [donThueData, phuongTienData]);

    const handleBack = () => {
        navigate('/admin/admin_dashboard_report-rental');
    };

    // Thống kê tổng quan
    const stats = useMemo(() => {
        const totalVehicles = phuongTienData.length;
        const activeVehicles = phuongTienData.filter(v => v.trang_thai === 'DangThue').length;
        const availableVehicles = phuongTienData.filter(v => v.trang_thai === 'SanSang').length;
        const totalRevenue = donThueData.reduce((sum, order) => sum + order.tong_tien, 0);
        const avgRevenuePerVehicle = totalVehicles > 0 ? totalRevenue / totalVehicles : 0;

        return {
            totalVehicles,
            activeVehicles,
            availableVehicles,
            avgRevenuePerVehicle
        };
    }, [donThueData, phuongTienData]);

    return (
        <div className="admin-reporting-vehicle">
            <div className="admin-reporting-vehicle-container">
                {/* Header */}
                <div className="admin-reporting-vehicle-header">
                    <div className="header-left">
                        <button className="back-button" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="header-title">
                            <h1>Báo cáo Phương tiện</h1>
                            <p>Phân tích hiệu suất và tình trạng phương tiện</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge">
                            <span className="stat-value">{stats.totalVehicles}</span>
                            <span className="stat-label">Tổng PT</span>
                        </div>
                        <div className="stat-badge stat-active">
                            <span className="stat-value">{stats.activeVehicles}</span>
                            <span className="stat-label">Đang thuê</span>
                        </div>
                        <div className="stat-badge stat-available">
                            <span className="stat-value">{stats.availableVehicles}</span>
                            <span className="stat-label">Sẵn sàng</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">{formatCurrency(stats.avgRevenuePerVehicle)}</span>
                            <span className="stat-label">DT TB/PT</span>
                        </div>
                    </div>
                </div>

                {/* Biểu đồ 1: Top 10 Phương tiện có doanh thu cao nhất */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Top 10 Phương tiện Doanh thu cao nhất</h2>
                        <p>Xếp hạng phương tiện theo tổng doanh thu đạt được</p>
                    </div>
                    <div className="chart-container chart-horizontal">
                        <ResponsiveBar
                            data={topVehiclesData}
                            keys={['Doanh thu']}
                            indexBy="vehicle"
                            layout="horizontal"
                            margin={{ top: 20, right: 130, bottom: 50, left: 250 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            colors={['#10b981']}
                            borderRadius={8}
                            axisBottom={{
                                legend: 'Doanh thu (VNĐ)',
                                legendPosition: 'middle',
                                legendOffset: 40,
                                format: (value) => formatCurrency(value)
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0
                            }}
                            enableLabel={true}
                            label={(d) => formatCurrency(d.value as number)}
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
                                    <div>Doanh thu: <span>{Number(value).toLocaleString('vi-VN')} VNĐ</span></div>
                                    <div>Số lượt thuê: <span>{(data as any)['Số lượt thuê']}</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig="gentle"
                        />
                    </div>
                </div>

                {/* Biểu đồ 2: Phân bố phương tiện theo trạng thái */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Phân bố Phương tiện theo Trạng thái</h2>
                        <p>Tỷ lệ phương tiện đang sẵn sàng, đang thuê và bảo trì</p>
                    </div>
                    <div className="chart-container chart-pie">
                        <ResponsivePie
                            data={vehicleStatusData}
                            margin={{ top: 40, right: 120, bottom: 80, left: 120 }}
                            innerRadius={0.6}
                            padAngle={1}
                            cornerRadius={4}
                            activeOuterRadiusOffset={8}
                            colors={['#10b981', '#f59e0b', '#ef4444', '#94a3b8']}
                            borderWidth={1}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor="var(--text-gray)"
                            arcLinkLabelsThickness={2}
                            arcLinkLabelsColor={{ from: 'color' }}
                            arcLabelsSkipAngle={10}
                            arcLabelsTextColor="#ffffff"
                            theme={{
                                labels: { text: { fontSize: 13, fontWeight: 600 } },
                                tooltip: { container: { fontSize: 13 } }
                            }}
                            tooltip={({ datum }) => (
                                <div className="chart-tooltip">
                                    <strong>{datum.label}</strong>
                                    <div>Số lượng: <span>{datum.value} xe</span></div>
                                    <div>Tỷ lệ: <span>{((datum.value / phuongTienData.length) * 100).toFixed(1)}%</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig="gentle"
                            transitionMode="middleAngle"
                        />
                    </div>
                </div>

                {/* Biểu đồ 3: Xu hướng thuê theo thời gian của Top 5 phương tiện */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Xu hướng thuê của Top 5 Phương tiện</h2>
                        <p>Số lượt thuê theo thời gian của các phương tiện có doanh thu cao nhất</p>
                    </div>
                    <div className="chart-container">
                        <ResponsiveLine
                            data={vehicleTrendOverTime}
                            margin={{ top: 50, right: 180, bottom: 50, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 0, max: 'auto' }}
                            curve="catmullRom"
                            axisBottom={{
                                tickRotation: -45,
                                legend: 'Tháng',
                                legendOffset: 45,
                                legendPosition: 'middle'
                            }}
                            axisLeft={{
                                legend: 'Số lượt thuê',
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
                                    itemsSpacing: 2,
                                    itemDirection: 'left-to-right',
                                    itemWidth: 150,
                                    itemHeight: 20,
                                    itemOpacity: 0.85,
                                    symbolSize: 12,
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
                                    <strong>{point.serieId}</strong>
                                    <div>{point.data.xFormatted}: <span>{point.data.yFormatted} lượt</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig="gentle"
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

export default AdminReportingVehicle;
