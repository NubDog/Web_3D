import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import Sub_Button from '../../../Button/Sub-Button/Sub-Button';
import './../../../../styles/pages/Admin/admin_dashboard_report-rental/admin_reporting_customer.css';

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

const AdminReportingCustomer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const donThueData = (location.state?.donThueData || []) as DonThueData[];
    const khachHangData = (location.state?.khachHangData || []) as KhachHangData[];

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

    // Biểu đồ 1: Top 10 Khách hàng VIP theo doanh thu
    const topCustomersData = useMemo(() => {
        // Tính tổng doanh thu cho mỗi khách hàng
        const customerRevenue: { [key: number]: { name: string; revenue: number; orders: number } } = {};
        
        donThueData.forEach(order => {
            const customer = khachHangData.find(kh => kh.khach_hang_id === order.khach_hang_id);
            if (customer) {
                if (!customerRevenue[order.khach_hang_id]) {
                    customerRevenue[order.khach_hang_id] = {
                        name: customer.ho_ten,
                        revenue: 0,
                        orders: 0
                    };
                }
                customerRevenue[order.khach_hang_id].revenue += order.tong_tien;
                customerRevenue[order.khach_hang_id].orders += 1;
            }
        });

        // Chuyển đổi thành mảng và sắp xếp theo doanh thu
        return Object.values(customerRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(item => ({
                customer: item.name,
                'Doanh thu': item.revenue,
                'Số đơn': item.orders
            }));
    }, [donThueData, khachHangData]);

    // Biểu đồ 2: Phân bố khách hàng theo thành phố
    const customerByLocationData = useMemo(() => {
        const locationCount: { [key: string]: number } = {};
        
        khachHangData.forEach(customer => {
            const city = customer.thanh_pho || 'Không xác định';
            locationCount[city] = (locationCount[city] || 0) + 1;
        });

        // Lấy top 8 thành phố, nhóm phần còn lại vào "Khác"
        const sortedLocations = Object.entries(locationCount)
            .sort(([, a], [, b]) => b - a);

        const top8 = sortedLocations.slice(0, 8);
        const others = sortedLocations.slice(8);

        const data = top8.map(([city, count]) => ({
            id: city,
            label: city,
            value: count
        }));

        if (others.length > 0) {
            const othersTotal = others.reduce((sum, [, count]) => sum + count, 0);
            data.push({
                id: 'Khác',
                label: 'Khác',
                value: othersTotal
            });
        }

        return data;
    }, [khachHangData]);

    // Biểu đồ 3: Hoạt động thuê xe theo thời gian của Top 5 khách hàng
    const customerActivityOverTime = useMemo(() => {
        // Lấy top 5 khách hàng
        const topCustomers = Object.entries(
            donThueData.reduce((acc, order) => {
                if (!acc[order.khach_hang_id]) {
                    acc[order.khach_hang_id] = 0;
                }
                acc[order.khach_hang_id] += order.tong_tien;
                return acc;
            }, {} as { [key: number]: number })
        )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => parseInt(id));

        // Tạo dữ liệu cho từng khách hàng
        return topCustomers.map(customerId => {
            const customer = khachHangData.find(kh => kh.khach_hang_id === customerId);
            const monthlyOrders: { [key: string]: number } = {};

            donThueData
                .filter(order => order.khach_hang_id === customerId)
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
                id: customer?.ho_ten || `Khách hàng ${customerId}`,
                data: sortedMonths.map(month => ({
                    x: month,
                    y: monthlyOrders[month]
                }))
            };
        });
    }, [donThueData, khachHangData]);

    const handleBack = () => {
        navigate('/admin/admin_dashboard_report-rental');
    };

    // Thống kê tổng quan
    const stats = useMemo(() => {
        const totalCustomers = khachHangData.length;
        const activeCustomers = new Set(donThueData.map(order => order.khach_hang_id)).size;
        const avgOrdersPerCustomer = activeCustomers > 0 ? (donThueData.length / activeCustomers).toFixed(1) : 0;
        const avgRevenuePerCustomer = activeCustomers > 0 
            ? donThueData.reduce((sum, order) => sum + order.tong_tien, 0) / activeCustomers
            : 0;

        return {
            totalCustomers,
            activeCustomers,
            avgOrdersPerCustomer,
            avgRevenuePerCustomer
        };
    }, [donThueData, khachHangData]);

    return (
        <div className="admin-reporting-customer">
            <div className="admin-reporting-customer-container">
                {/* Header */}
                <div className="admin-reporting-customer-header">
                    <div className="header-left">
                        <button className="back-button" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="header-title">
                            <h1>Báo cáo Khách hàng</h1>
                            <p>Phân tích hành vi và giá trị khách hàng</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge">
                            <span className="stat-value">{stats.totalCustomers}</span>
                            <span className="stat-label">Tổng KH</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">{stats.activeCustomers}</span>
                            <span className="stat-label">KH hoạt động</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">{stats.avgOrdersPerCustomer}</span>
                            <span className="stat-label">Đơn TB/KH</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">{formatCurrency(stats.avgRevenuePerCustomer)}</span>
                            <span className="stat-label">Doanh thu TB</span>
                        </div>
                    </div>
                </div>

                {/* Biểu đồ 1: Top 10 Khách hàng VIP */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Top 10 Khách hàng VIP</h2>
                        <p>Khách hàng có tổng doanh thu cao nhất</p>
                    </div>
                    <div className="chart-container chart-horizontal">
                        <ResponsiveBar
                            data={topCustomersData}
                            keys={['Doanh thu']}
                            indexBy="customer"
                            layout="horizontal"
                            margin={{ top: 20, right: 130, bottom: 50, left: 200 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            colors={['#3b82f6']}
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
                                    <div>Số đơn: <span>{(data as any)['Số đơn']}</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig="gentle"
                        />
                    </div>
                </div>

                {/* Biểu đồ 2: Phân bố khách hàng theo thành phố */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Phân bố Khách hàng theo Thành phố</h2>
                        <p>Phân tích địa lý khách hàng của hệ thống</p>
                    </div>
                    <div className="chart-container chart-pie">
                        <ResponsivePie
                            data={customerByLocationData}
                            margin={{ top: 40, right: 120, bottom: 80, left: 120 }}
                            innerRadius={0.6}
                            padAngle={1}
                            cornerRadius={4}
                            activeOuterRadiusOffset={8}
                            colors={{ scheme: 'nivo' }}
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
                                    <div>Số khách hàng: <span>{datum.value}</span></div>
                                    <div>Tỷ lệ: <span>{((datum.value / khachHangData.length) * 100).toFixed(1)}%</span></div>
                                </div>
                            )}
                            animate={true}
                            motionConfig="gentle"
                            transitionMode="middleAngle"
                        />
                    </div>
                </div>

                {/* Biểu đồ 3: Hoạt động thuê xe của Top 5 khách hàng */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2>Hoạt động của Top 5 Khách hàng</h2>
                        <p>Tần suất thuê phương tiện theo thời gian của các khách hàng VIP</p>
                    </div>
                    <div className="chart-container">
                        <ResponsiveLine
                            data={customerActivityOverTime}
                            margin={{ top: 50, right: 160, bottom: 50, left: 60 }}
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
                                legend: 'Số đơn thuê',
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
                                    translateX: 140,
                                    translateY: 0,
                                    itemsSpacing: 2,
                                    itemDirection: 'left-to-right',
                                    itemWidth: 130,
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
                                    <strong>{point.seriesId}</strong>
                                    <div>{point.data.xFormatted}: <span>{point.data.yFormatted} đơn</span></div>
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

export default AdminReportingCustomer;
