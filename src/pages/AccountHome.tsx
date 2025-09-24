import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import Button from '../components/Button/Button';
import ChangePasswordModal from '../components/ChangePasswordModal/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';
import './../styles/pages/AccountHome/AccountHome.css';

interface UserProfile {
    nguoi_dung_id: number;
    ten_dang_nhap: string;
    vai_tro: string;
    trang_thai: string;
    ho_ten: string;
    email: string;
    so_dien_thoai: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
}

const AccountHome = () => {
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        so_dien_thoai: ''
    });

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api/user-profile';

    // Fetch user profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser?.nguoi_dung_id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}?nguoi_dung_id=${currentUser.nguoi_dung_id}`);
                const result = await response.json();

                if (result.success) {
                    setUserProfile(result.data);
                    setFormData({
                        ho_ten: result.data.ho_ten || '',
                        email: result.data.email || '',
                        so_dien_thoai: result.data.so_dien_thoai || ''
                    });
                } else {
                    setError(result.error || 'Không thể tải thông tin người dùng');
                }
            } catch (err: any) {
                setError('Lỗi kết nối đến server');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${API_URL}/${currentUser?.nguoi_dung_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage('Cập nhật thông tin thành công!');
                setIsEditing(false);
                // Refresh user profile
                const refreshResponse = await fetch(`${API_URL}?nguoi_dung_id=${currentUser?.nguoi_dung_id}`);
                const refreshResult = await refreshResponse.json();
                if (refreshResult.success) {
                    setUserProfile(refreshResult.data);
                }
            } else {
                setError(result.error || 'Có lỗi xảy ra khi cập nhật thông tin');
            }
        } catch (err: any) {
            setError('Lỗi kết nối đến server');
        } finally {
            setSaving(false);
        }
    };

    // Handle change password
    const handleChangePassword = async (oldPassword: string, newPassword: string) => {
        const response = await fetch(`${API_URL}/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nguoi_dung_id: currentUser?.nguoi_dung_id,
                old_password: oldPassword,
                new_password: newPassword
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Có lỗi xảy ra khi đổi mật khẩu');
        }

        setSuccessMessage('Đổi mật khẩu thành công!');
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Clear messages after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // If not logged in
    if (!currentUser) {
        return (
            <div className="AccountHome-container">
                <Header />
                <div className="AccountHome-not-logged-in">
                    <div className="AccountHome-login-prompt">
                        <h2>Vui lòng đăng nhập</h2>
                        <p>Bạn cần đăng nhập để xem thông tin tài khoản</p>
                        <Link to="/signin">
                            <Button conttent="Đăng nhập" />
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="AccountHome-container">
                <Header />
                <div className="AccountHome-loading">
                    <h2>Đang tải thông tin...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="AccountHome-container">
            <Header />
            <div className="AccountHome-content">
                <div className="AccountHome-profile">
                    <div className="AccountHome-header">
                        <h1>Thông tin tài khoản</h1>
                        <div className="AccountHome-header-buttons">
                            {!isEditing && (
                                <Button 
                                    conttent="Chỉnh sửa" 
                                    onClick={() => setIsEditing(true)}
                                />
                            )}
                            <Link to="/account_home/account_home_kyc">
                                <Button conttent="Xem KYC" />
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="AccountHome-error">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="AccountHome-success">
                            {successMessage}
                        </div>
                    )}

                    {userProfile && (
                        <form onSubmit={handleSubmit} className="AccountHome-form">
                            <div className="AccountHome-form-grid">
                                {/* Tên đăng nhập - Read only */}
                                <div className="AccountHome-field">
                                    <label>Tên đăng nhập</label>
                                    <input 
                                        type="text" 
                                        value={userProfile.ten_dang_nhap}
                                        disabled
                                    />
                                </div>

                                {/* Mật khẩu - Special field */}
                                <div className="AccountHome-field">
                                    <label>Mật khẩu</label>
                                    <div className="AccountHome-password-field">
                                        <input 
                                            type="password" 
                                            value="••••••••"
                                            disabled
                                        />
                                        <button 
                                            type="button"
                                            className="AccountHome-change-password-btn"
                                            onClick={() => setIsPasswordModalOpen(true)}
                                        >
                                            Đổi mật khẩu
                                        </button>
                                    </div>
                                </div>

                                {/* Họ tên - Editable */}
                                <div className="AccountHome-field">
                                    <label>Họ và tên</label>
                                    <input 
                                        type="text" 
                                        name="ho_ten"
                                        value={isEditing ? formData.ho_ten : userProfile.ho_ten}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>

                                {/* Email - Editable */}
                                <div className="AccountHome-field">
                                    <label>Email</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={isEditing ? formData.email : userProfile.email}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>

                                {/* Số điện thoại - Editable */}
                                <div className="AccountHome-field">
                                    <label>Số điện thoại</label>
                                    <input 
                                        type="tel" 
                                        name="so_dien_thoai"
                                        value={isEditing ? formData.so_dien_thoai : userProfile.so_dien_thoai}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        pattern="[0-9]{10}"
                                        required
                                    />
                                </div>

                                {/* Trạng thái - Read only */}
                                <div className="AccountHome-field">
                                    <label>Trạng thái</label>
                                    <input 
                                        type="text" 
                                        value={userProfile.trang_thai === 'active' ? 'Hoạt động' : userProfile.trang_thai}
                                        disabled
                                    />
                                </div>

                                {/* Ngày tạo - Read only */}
                                <div className="AccountHome-field">
                                    <label>Ngày tạo</label>
                                    <input 
                                        type="text" 
                                        value={new Date(userProfile.ngay_tao).toLocaleDateString('vi-VN')}
                                        disabled
                                    />
                                </div>

                                {/* Ngày cập nhật - Read only */}
                                <div className="AccountHome-field">
                                    <label>Ngày cập nhật</label>
                                    <input 
                                        type="text" 
                                        value={new Date(userProfile.ngay_cap_nhat).toLocaleDateString('vi-VN')}
                                        disabled
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="AccountHome-form-actions">
                                    <button 
                                        type="button"
                                        className="AccountHome-cancel-btn"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                ho_ten: userProfile.ho_ten || '',
                                                email: userProfile.email || '',
                                                so_dien_thoai: userProfile.so_dien_thoai || ''
                                            });
                                        }}
                                        disabled={isSaving}
                                    >
                                        Hủy
                                    </button>
                                    <Button 
                                        conttent={isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                        onClick={() => {}} // Form submit sẽ handle
                                    />
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>

            <ChangePasswordModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handleChangePassword}
                isLoading={false}
            />

            <Footer />
        </div>
    );
};

export default AccountHome;