import React, { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import styles from '../css/admin.module.css';
import { Link } from 'react-router-dom';
import locations from '../../../data/data.json';
import Pagination from '../Pagination';

// Định nghĩa kiểu dữ liệu cho một User
interface User {
    nguoi_dung_id: number;
    ten_dang_nhap:string;
    ho_ten: string;
    vai_tro: string;
    trang_thai:string;
    email: string;
    so_dien_thoai?: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
}

interface Customer {
    khach_hang_id: number;
    nguoi_dung_id: number;
    ho_ten: string;
    ngay_sinh: string;
    dia_chi: string;
    thanh_pho: string;
    tinh: string;
    ma_buu_chinh?: string;
    quoc_gia?: string;
}

interface District {
    Id: string;
    Name: string;
}

// Component chính
const UserAdmin: React.FC = () => {
    const API_BASE_URL = 'http://127.0.0.1:8787';

    // States
   const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [selectedRole, setSelectedRole] = useState('KhachHang'); 

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);

    // States cho modal Khóa/Mở khóa 
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [userToLock, setUserToLock] = useState<User | null>(null);

    // State cho thông báo (Toast)
    const [toast, setToast] = useState<{ message: string; isError: boolean; show: boolean }>({
        message: '', isError: false, show: false,
    });

    const [districts, setDistricts] = useState<District[]>([]);

    //lọc
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState(''); 
    const [filterStatus, setFilterStatus] = useState(''); 
    const [filterDate, setFilterDate] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    //Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);



    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Lọc theo Search Term (Tên, Email, SĐT)
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                user.ho_ten.toLowerCase().includes(searchTermLower) ||
                user.email.toLowerCase().includes(searchTermLower) ||
                user.so_dien_thoai?.includes(searchTerm);

            // Lọc theo Vai trò
            const matchesRole = filterRole === '' || user.vai_tro === filterRole;

            // Lọc theo Trạng thái
            const matchesStatus = filterStatus === '' || user.trang_thai === filterStatus;

            // Lọc theo Ngày tạo
            const matchesDate = filterDate === '' || user.ngay_tao.startsWith(filterDate);

            return matchesSearch && matchesRole && matchesStatus && matchesDate;
        });
    }, [users, searchTerm, filterRole, filterStatus, filterDate]);


    useEffect(() => {
    fetchUsers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredUsers]);

    // Hàm hiển thị toast
    const showToast = (message: string, isError = false) => {
        setToast({ message, isError, show: true });
        setTimeout(() => {
            setToast({ message: '', isError: false, show: false });
        }, 3000);
    };

     
    
    // Hàm định dạng ngày tháng
     const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            }).format(new Date(dateString));
        } catch (e) {
            return 'N/A';
        }
    };

    // Hàm gọi API để lấy danh sách người dùng
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/nguoi-dung`);
            if (!response.ok) throw new Error('Lỗi mạng hoặc server không phản hồi');
            const result = await response.json();
            if (result.success) {
                setUsers(result.data);
            } else {
                throw new Error(result.error || 'Không thể tải danh sách người dùng');
            }
        } catch (err: any) {
            setError(`Lỗi: ${err.message}`);
            showToast(`Lỗi: ${err.message}`, true);
        } finally {
            setIsLoading(false);
        }
    };

    // Mở modal để thêm/sửa
    const handleOpenModal = (user: User | null = null) => {
        setCurrentUser(user ? { ...user } : {});
        setSelectedRole(user?.vai_tro || 'KhachHang'); // Cập nhật role khi mở modal
        setIsUserModalOpen(true);
    };

    // Đóng modal
     const handleCloseModal = () => {
        setIsUserModalOpen(false);
        setIsCustomerModalOpen(false);
        setIsDeleteModalOpen(false);
        setCurrentUser(null);
        setCurrentCustomer(null);
    };

    const handleLockUnlock = async (user: User) => {
        setUserToLock(user);
        setIsLockModalOpen(true);
    };

     
    
     const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const confirmLockUnlock = async () => {
    if (!userToLock) return;
    
    try {
            const newStatus = userToLock.trang_thai === 'active' ? 'inactive' : 'active';
            const response = await fetch(`${API_BASE_URL}/nguoi-dung/${userToLock.nguoi_dung_id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trang_thai: newStatus })
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Không thể thay đổi trạng thái người dùng');
            }

            // Update the users list with the new status
            setUsers(users.map(u => 
                u.nguoi_dung_id === userToLock.nguoi_dung_id 
                    ? { ...u, trang_thai: newStatus }
                    : u
            ));

            showToast(result.message || 'Cập nhật trạng thái thành công');
        } catch (error: any) {
            showToast(`Lỗi: ${error.message}`, true);
        } finally {
            setIsLockModalOpen(false);
            setUserToLock(null);
        }
    };
        
    // Xử lý submit form
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // Logic cũ của bạn cho mật khẩu
        if (!currentUser?.nguoi_dung_id && !data.MatKhau) {
            showToast('Mật khẩu là bắt buộc khi tạo người dùng mới.', true);
            return;
        }

        const url = currentUser?.nguoi_dung_id
            ? `${API_BASE_URL}/nguoi-dung/${currentUser.nguoi_dung_id}`
            : `${API_BASE_URL}/nguoi-dung`;
        const method = currentUser?.nguoi_dung_id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                showToast(result.message);
                handleCloseModal();
                fetchUsers();
            } else {
                throw new Error(result.error || 'Thao tác thất bại');
            }
        } catch (error: any) {
            showToast(error.message, true);
        }
    };

    const handleProvinceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    const selectedProvince = locations.find(p => p.Name === provinceName);
    
    if (currentUser) {
        setCurrentUser(prev => ({
            ...prev,
            tinh: provinceName,
            thanh_pho: '',
        }));
    }
    
    setDistricts(selectedProvince ? selectedProvince.Districts : []);
};
    // Mở modal xác nhận xóa
   const handleDeleteClick = (id: number) => {
        setUserIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    
    const handleViewCustomer = async (userId: number) => {
        setIsCustomerLoading(true);
        setIsCustomerModalOpen(true);
        setCurrentCustomer(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/customers/by-user/${userId}`);
            const result = await response.json();
            if (response.status === 404) {
                 throw new Error('Người dùng này chưa có hồ sơ khách hàng.');
            }
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Không thể tải thông tin khách hàng');
            }
            setCurrentCustomer(result.data);
        } catch (error: any) {
            showToast(error.message, true);
            setTimeout(() => setIsCustomerModalOpen(false), 2000);
        } finally {
            setIsCustomerLoading(false);
        }
    };

    // Xác nhận xóa
    const confirmDelete = async () => {
        if (!userIdToDelete) return;
        try {
            const response = await fetch(`${API_BASE_URL}/nguoi-dung/${userIdToDelete}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                showToast(result.message);
                fetchUsers();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            showToast(error.message, true);
        } finally {
            setIsDeleteModalOpen(false);
            setUserIdToDelete(null);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>Quản lý người dùng</h1>
                <p className={styles.headerSubtitle}>Thêm, xem, sửa và xóa thông tin người dùng.</p>
            </header>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Danh sách người dùng</h2>
                    <div className='flex items-center gap-4'>
                        <button 
                            onClick={() => setIsFilterVisible(!isFilterVisible)} 
                            className={`${styles.button} ${styles.filterToggleButton}`}
                        >
                            Bộ lọc
                        </button>
                        <button onClick={() => handleOpenModal()} className={`${styles.button} ${styles.buttonPrimary}`}>
                            Thêm người dùng mới
                        </button>
                    </div>
                </div>
                <div className={styles.buttonGroup}>
                </div>

                {isFilterVisible && (
                    <div className={styles.filterBar}>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, SĐT..."
                            className={styles.filterInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className={styles.filterSelect}
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="KhachHang">Khách hàng</option>
                            <option value="NhanVien">Nhân viên</option>
                            <option value="admin">Quản trị viên</option>
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <input
                            type="date"
                            className={styles.filterInput}
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setFilterRole('');
                                setFilterStatus('');
                                setFilterDate('');
                            }}
                            className={`${styles.button} ${styles.buttonSecondary}`}
                        >
                            Reset
                        </button>
                    </div>
                )}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên đăng nhập</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Ngày cập nhật</th>
                                <th className={styles.textRight}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={10} className={styles.tableMessage}>Đang tải dữ liệu...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={10} className={`${styles.tableMessage} ${styles.errorText}`}>{error}</td></tr>
                            ) : paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user, index) => (
                                    <tr key={user.nguoi_dung_id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{user.ten_dang_nhap}</td>
                                        <td>{user.ho_ten}</td>
                                        <td>{user.email}</td>
                                        <td>{user.so_dien_thoai || 'N/A'}</td>
                                        <td>{user.vai_tro }</td>
                                       <td style={{ textAlign: "center" }}>
                                            <span
                                                style={{
                                                display: "inline-block",
                                                minWidth: "80px",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontWeight: "bold",
                                                backgroundColor:
                                                    user.trang_thai === "active" || user.trang_thai === "hoat_dong"
                                                    ? "rgba(0, 200, 0, 0.15)"   // nền xanh nhạt
                                                    : "rgba(255, 0, 0, 0.15)",  // nền đỏ nhạt
                                                color:
                                                    user.trang_thai === "active" || user.trang_thai === "hoat_dong"
                                                    ? "green"
                                                    : "red",
                                                }}
                                            >
                                                {user.trang_thai === "active" || user.trang_thai === "hoat_dong"
                                                ? "Active"
                                                : "Inactive"}
                                            </span>
                                            </td>
                                        <td>{formatDate(user.ngay_tao)}</td>
                                        <td>{formatDate(user.ngay_cap_nhat)}</td>
                                        <td className={styles.textRight}>
                                            {user.vai_tro !== 'admin' ? (
                                                <>
                                                    <Link 
                                                        to={`/admin/users/${user.nguoi_dung_id}/customer-detail`}
                                                        className={`${styles.actionButton} ${styles.viewButton}`}
                                                    >
                                                        Xem
                                                    </Link>
                                                    <button 
                                                        className={`${styles.actionButton} ${user.trang_thai === 'active' ? styles.lockButton : user.trang_thai === 'hoat_dong'?  styles.lockButton  : styles.unlockButton}`}
                                                        onClick={() => handleLockUnlock(user)}
                                                    >
                                                        {user.trang_thai === 'active' ? 'Khóa' : user.trang_thai === "hoat_dong" ? 'Khóa':'Mở khóa'}
                                                    </button>
                                                     <button className={`${styles.actionButton} ${styles.editButton}`} onClick={() => handleOpenModal(user)}>Sửa</button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteClick(user.nguoi_dung_id)}>Xóa</button>
                                                </>
                                                 
                                            ) : (
                                                <>
                                                    <div>Thành,Khoa đẹp trai </div>
                                                </> 
                                                )}
                                           
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={9} className={styles.tableMessage}>Không có người dùng nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- CÁC MODALL  --- */}

            {/* Modal Thêm/Sửa User*/}
            {isUserModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <h3 className={styles.modalTitle}>{currentUser?.nguoi_dung_id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
                            <div className={styles.formFields}>
                                {/* Các trường thông tin người dùng */}
                                <div><label>Tên đăng nhập</label><input name="TenDangNhap" defaultValue={currentUser?.ten_dang_nhap} required /></div>
                                <div><label>Họ Tên</label><input name="HoTen" defaultValue={currentUser?.ho_ten} required /></div>
                                <div><label>Email</label><input type="email" name="Email" defaultValue={currentUser?.email} required /></div>
                                {!currentUser?.nguoi_dung_id && (
                                    <div><label>Mật khẩu</label><input type="password" name="MatKhau" required /></div>
                                )}
                                <div><label>Số điện thoại</label><input type="tel" name="SoDienThoai" defaultValue={currentUser?.so_dien_thoai} /></div>
                                <div>
                                    <label>Vai trò</label>
                                    <select name="VaiTro" defaultValue={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                        <option value="KhachHang">Khách hàng</option>
                                        <option value="NhanVien">Nhân viên</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/*  Hiển thị nếu vai trò là Khách Hàng khi tạo mới --- */}
                            {selectedRole === 'KhachHang' && !currentUser?.nguoi_dung_id && (
                                <>
                                    <h4 className={styles.formSectionTitle}>Thông tin hồ sơ khách hàng</h4>
                                    <div className={styles.formFields}>
                                        <div><label>Ngày sinh (YYYY-MM-DD)</label><input type="date" name="ngay_sinh" required /></div>
                                        <div><label>Địa chỉ</label><input name="dia_chi" required /></div>
                                        <div>
                                            <label>Tỉnh/Thành phố</label>
                                            <select 
                                                name="tinh" 
                                                onChange={handleProvinceChange}
                                                required
                                            >
                                                <option value="">-- Chọn Tỉnh/Thành --</option>
                                                {locations.map(p => (
                                                    <option key={p.Id} value={p.Name}>{p.Name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label>Quận/Huyện</label>
                                            <select 
                                                name="thanh_pho" 
                                                required
                                                disabled={districts.length === 0}
                                            >
                                                <option value="">-- Chọn Quận/Huyện --</option>
                                                {districts.map(d => (
                                                    <option key={d.Id} value={d.Name}>{d.Name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div><label>Mã bưu chính</label><input name="ma_buu_chinh" /></div>
                                        <div><label>Quốc gia</label><input name="quoc_gia" defaultValue="Việt Nam" /></div>
                                    </div>
                                </>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={handleCloseModal} className={`${styles.button} ${styles.buttonSecondary}`}>Hủy</button>
                                <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

             {/* Modal Xóa */}
             {isDeleteModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentSmall}>
                        <h3 className={styles.modalTitle}>Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.</p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsDeleteModalOpen(false)} className={`${styles.button} ${styles.buttonSecondary}`}>Hủy</button>
                            <button onClick={confirmDelete} className={`${styles.button} ${styles.buttonDanger}`}>Xóa</button>
                        </div>
                    </div>
                </div>
             )}

             {/* Modal Khóa/Mở khóa */}
            {isLockModalOpen && userToLock && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentSmall}>
                        <h3 className={styles.modalTitle}>
                            {userToLock.trang_thai === 'active' 
                                ? 'Xác nhận khóa người dùng' 
                                :  userToLock.trang_thai === 'hoat_dong'? 'Xác nhận khóa người dùng'  : 'Xác nhận mở khóa người dùng'}
                        </h3>
                        <p>
                            {userToLock.trang_thai === 'active' 
                                ? `Bạn có chắc chắn muốn khóa người dùng "${userToLock.ho_ten}" không?` 
                                : userToLock.trang_thai === 'hoat_dong'? `Bạn có chắc chắn muốn khóa người dùng "${userToLock.ho_ten}" không?` : `Bạn có chắc chắn muốn mở khóa người dùng "${userToLock.ho_ten}" không?`}
                        </p>
                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setIsLockModalOpen(false)} 
                                className={`${styles.button} ${styles.buttonSecondary}`}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={confirmLockUnlock} 
                                className={`${styles.button} ${
                                    userToLock.trang_thai === 'active' 
                                        ? styles.buttonDanger 
                                        : userToLock.trang_thai === "hoat_dong"
                                        ? styles.buttonDanger  
                                        : styles.buttonSuccess
                                }`}
                            >
                                {userToLock.trang_thai === 'active' ? 'Khóa' : userToLock.trang_thai === "hoat_dong"? 'Khóa':'Mở khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

             {isCustomerModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                         <h3 className={styles.modalTitle}>Thông tin chi tiết khách hàng</h3>
                         {isCustomerLoading ? (
                            <p>Đang tải...</p>
                         ) : currentCustomer ? (
                            <div className={styles.customerDetails}>
                                <p><strong>Họ tên:</strong> {currentCustomer.ho_ten}</p>
                                <p><strong>Ngày sinh:</strong> {formatDate(currentCustomer.ngay_sinh).split(' ')[0]}</p>
                                <p><strong>Địa chỉ:</strong> {`${currentCustomer.dia_chi}, ${currentCustomer.thanh_pho}, ${currentCustomer.tinh}`}</p>
                                <p><strong>Mã bưu chính:</strong> {currentCustomer.ma_buu_chinh || 'N/A'}</p>
                                <p><strong>Quốc gia:</strong> {currentCustomer.quoc_gia || 'N/A'}</p>
                            </div>
                         ) : (
                            <p className={styles.errorText}>Không có dữ liệu.</p>
                         )}
                         <div className={styles.modalActions}>
                            <button onClick={handleCloseModal} className={`${styles.button} ${styles.buttonSecondary}`}>Đóng</button>
                         </div>
                    </div>
                </div>
            )}
            
             {/* Toast */}
            {toast.show && (
                <div className={`${styles.toast} ${toast.isError ? styles.toastError : styles.toastSuccess}`}>
                    <p>{toast.message}</p>
                </div>
            )}
            <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
        </div>
        
    );
};

export default UserAdmin;

