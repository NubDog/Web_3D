import React, { useState, useEffect, type FormEvent } from 'react';
import styles from './admin.module.css'; // NHẬP KHẨU file CSS

// Định nghĩa kiểu dữ liệu cho một User
interface User {
    nguoi_dung_id: number;
    ten_dang_nhap:string;
    ho_ten: string;
    vai_tro: string;
    email: string;
    so_dien_thoai?: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
}



// Component chính
const UserAdmin: React.FC = () => {
    const API_BASE_URL = 'http://127.0.0.1:8787';

    // States
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; isError: boolean; show: boolean }>({
        message: '',
        isError: false,
        show: false,
    });

    // Fetch users khi component được render
    useEffect(() => {
        fetchUsers();
    }, []);

    // Hàm hiển thị toast
    const showToast = (message: string, isError = false) => {
        setToast({ message, isError, show: true });
        setTimeout(() => {
            setToast({ message: '', isError: false, show: false });
        }, 3000);
    };
    
    // Hàm định dạng ngày tháng
    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
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
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            if (result.success) {
                setUsers(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch users');
            }
        } catch (err: any) {
            setError(`Lỗi khi tải dữ liệu: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Mở modal để thêm/sửa
    const handleOpenModal = (user: User | null = null) => {
        setCurrentUser(user ? { ...user } : {});
        setIsModalOpen(true);
    };

    // Đóng modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    // Xử lý submit form
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        
        const password = formData.get('MatKhau') as string;
        if (!currentUser?.nguoi_dung_id && !password) {
            showToast('Mật khẩu là bắt buộc khi tạo người dùng mới.', true);
            return;
        }

        const data: any = {
            HoTen: formData.get('HoTen'),
            TenDangNhap:formData.get('TenDangNhap'),
            Email: formData.get('Email'),
            SoDienThoai: formData.get('SoDienThoai'),
            VaiTro: formData.get('VaiTro'),
        };

        if (!currentUser?.nguoi_dung_id) {
            data.MatKhau = password;
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
                throw new Error(result.error || 'Operation failed');
            }
        } catch (error: any) {
            showToast(error.message, true);
        }
    };

    // Mở modal xác nhận xóa
    const handleDeleteClick = (id: number) => {
        setUserIdToDelete(id);
        setIsDeleteModalOpen(true);
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
        const STT = 0;
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
                    <button onClick={() => handleOpenModal()} className={`${styles.button} ${styles.buttonPrimary}`}>
                        Thêm người dùng mới
                    </button>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên đăng nhập</th>
                                <th>Họ Tên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò</th>
                                <th>Ngày tạo</th>
                                <th>Cập nhật</th>
                                <th className={styles.textRight}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className={styles.tableMessage}>Đang tải dữ liệu...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={7} className={`${styles.tableMessage} ${styles.errorText}`}>{error}</td></tr>
                            ) : users.length > 0 ? (
                             
                                users.map((user,index) => (
                                    <tr key={user.nguoi_dung_id}>
                                        <td>{index+1}</td>
                                        <td>{user.ten_dang_nhap}</td>
                                        <td>{user.ho_ten}</td>
                                        <td>{user.email}</td>
                                        <td>{user.so_dien_thoai || 'N/A'}</td>
                                        <td>{user.vai_tro}</td>
                                        <td>{formatDate(user.ngay_tao)}</td>
                                        <td>{formatDate(user.ngay_cap_nhat)}</td>
                                        <td className={styles.textRight}>
                                            <button className={`${styles.actionButton} ${styles.editButton}`} onClick={() => handleOpenModal(user)}>Sửa</button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteClick(user.nguoi_dung_id)}>Xóa</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className={styles.tableMessage}>Không có người dùng nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm/Sửa */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <h3 className={styles.modalTitle}>{currentUser?.nguoi_dung_id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
                            <div className={styles.formFields}>
                                <div>
                                    <label htmlFor="TenDangNhap">Tên đăng nhập</label>
                                    <input type="text" id="TenDangNhap" name="TenDangNhap" defaultValue={currentUser?.ten_dang_nhap} required />
                                </div>
                                <div>
                                    <label htmlFor="HoTen">Họ Tên</label>
                                    <input type="text" id="HoTen" name="HoTen" defaultValue={currentUser?.ho_ten} required />
                                </div>
                                <div>
                                    <label htmlFor="Email">Email</label>
                                    <input type="email" id="Email" name="Email" defaultValue={currentUser?.email} required />
                                </div>
                                {!currentUser?.nguoi_dung_id && (
                                    <div>
                                        <label htmlFor="MatKhau">Mật khẩu</label>
                                        <input type="password" id="MatKhau" name="MatKhau" required />
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="SoDienThoai">Số điện thoại</label>
                                    <input type="tel" id="SoDienThoai" name="SoDienThoai" defaultValue={currentUser?.so_dien_thoai} />
                                </div>
                                <div>
                                    <label htmlFor="VaiTro">Vai trò</label>
                                    <select id="VaiTro" name="VaiTro" defaultValue={currentUser?.vai_tro || 'KhachHang'}>
                                        <option value="KhachHang">Khách hàng</option>
                                        <option value="NhanVien">Nhân viên</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                            </div>
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
            
             {/* Toast */}
            {toast.show && (
                <div className={`${styles.toast} ${toast.isError ? styles.toastError : styles.toastSuccess}`}>
                    <p>{toast.message}</p>
                </div>
            )}
        </div>
    );
};

export default UserAdmin;

