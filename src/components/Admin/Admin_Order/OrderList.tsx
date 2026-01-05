import React, { useState, useEffect,useMemo, useCallback  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/Admin_order.css'; 

interface PendingOrder {
  don_thue_id: number;
  ngay_tao: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  tong_tien: number;
  ho_ten: string;
  ten_phuong_tien: string;
}

const ITEMS_PER_PAGE = 10;

const OrderList: React.FC = () => {
    const { status } = useParams<{ status: string }>();
    const navigate = useNavigate();

    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const pageTitles: { [key: string]: string } = {
        all: 'Tất Cả Đơn Hàng',
        pending: 'Đơn Hàng Chờ Duyệt',
        approved: 'Đơn Hàng Đã Duyệt',
        active: 'Đơn Hàng Đang Thuê',
        returned: 'Đơn Hàng Đã Trả (Chờ Quyết Toán)',
        completed: 'Đơn Hàng Đã Hoàn Tất',
        cancelled: 'TU_CHOI'
    };
    const title = status ? pageTitles[status] : 'Danh sách Đơn Hàng';


    const fetchOrders  = useCallback(async () => {
        if (!status) return;
        setIsLoading(true); 
        setError(null); 
            try {
                let apiUrl = `https://r2-api.sharkeatrice.workers.dev/orders`;
                if (status !== 'all') {
                    apiUrl += `?status=${status}`;
                }
                
                const response = await fetch(apiUrl);
        
                const result = await response.json();

                if (result.success && Array.isArray(result.data)) {
                    setOrders(result.data);
                } else {
                    throw new Error(result.error || 'Không thể tải danh sách đơn hàng.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        },[status]);


    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    

    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            order.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.ten_phuong_tien.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [orders, searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const currentOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleRowClick = (orderId: number) => {
        navigate(`/admin/order/${orderId}`);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    if (isLoading) {
        return <div className="admin-container"><p>Đang tải danh sách đơn hàng...</p></div>;
    }

    if (error) {
        return <div className="admin-container error-message"><p>Lỗi: {error}</p></div>;
    }

    return (
        <div className="admin-container">
                <h1>{title} ({filteredOrders.length})</h1>            
            <div className="action-bar">
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo tên khách, tên xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={fetchOrders}>Tải lại</button>
            </div>

            {orders.length === 0 ? (
                <p>Không có đơn hàng nào.</p>
            ) : (
                <>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã Đơn</th>
                            <th>Tên Khách Hàng</th>
                            <th>Tên Xe</th>
                            <th>Ngày Bắt Đầu</th>
                            <th>Tổng Tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.map((order) => (
                            <tr key={order.don_thue_id} onClick={() => handleRowClick(order.don_thue_id)}>
                                <td className='text1'>#{order.don_thue_id}</td>
                                <td className='text1'>{order.ho_ten}</td>
                                <td className='text1'>{order.ten_phuong_tien}</td>
                                <td className='text1'>{formatDate(order.ngay_bat_dau)}</td>
                                <td className='text1'> {formatCurrency(order.tong_tien)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="pagination">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                            Trước
                        </button>
                        <span>Trang {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                            Sau
                        </button>
                    </div>
            </>
            )}
        </div>
    );
};

export default OrderList;