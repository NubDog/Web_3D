import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/CustomerDetail.css';
import locations from '../../../../data/data.json';
import imageCompression from 'browser-image-compression';

// --- Interfaces ---
interface District {
    Id: string;
    Name: string;
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
    ngay_tao: string;
    ngay_cap_nhat: string;
    avatar: string;

    ten_dang_nhap: string;
    email: string;
    vai_tro: string;
    trang_thai: string;
}

const CustomerDetail: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState<Customer>({
        khach_hang_id: 0,
        nguoi_dung_id: 0,
        ho_ten: '',
        ngay_sinh: '',
        dia_chi: '',
        thanh_pho: '',
        tinh: '',
        ma_buu_chinh: '',
        quoc_gia: '',
        ngay_tao: '',
        ngay_cap_nhat: '',
        avatar: '',
        ten_dang_nhap: '',
        email: '',
        vai_tro: '',
        trang_thai: '',
    });    
    const [districts, setDistricts] = useState<District[]>([]);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);


    const API_BASE_URL = 'http://127.0.0.1:8787';

    useEffect(() => {
        const fetchCustomer = async () => {
            if (!userId) return;
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/customers/by-user/${userId}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Không thể tải dữ liệu khách hàng.');
                }
                setCustomer(result.data);
                setFormData(result.data);
            } catch (err: any) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomer();
    }, [userId]);
    
    const handleEditClick = (e: React.MouseEvent) => {
        if (!customer) return;
         e.preventDefault(); 
        // setFormData(customer);
        setFormData({...customer});
        setAvatarPreview(customer.avatar || null);
        setIsEditing(true);
        
        const currentProvince = locations.find(p => p.Name === customer.tinh);
        if (currentProvince) {
            setDistricts(currentProvince.Districts);
        }
    };

   const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        console.log(`Ảnh gốc: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        const options = {
             maxSizeMB: 0.9, 
            maxWidthOrHeight: 1024, 
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            console.log(`Ảnh đã nén: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

            setAvatarFile(compressedFile); 
            setAvatarPreview(URL.createObjectURL(compressedFile));

        } catch (error) {
            console.error('Lỗi nén ảnh:', error);
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }
};

    const handleProvinceChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const provinceName = e.target.value;
        const selectedProvince = locations.find(p => p.Name === provinceName);
        
        setFormData(prev => ({
            ...prev,
            tinh: provinceName,
            thanh_pho: '', 
        }));
        
        setDistricts(selectedProvince ? selectedProvince.Districts : []);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;



    let finalFormData = { ...formData };
    setIsUploading(true);

    try {
        if (avatarFile) {
            console.log("Phát hiện có file, đang tạo FormData..."); 
            const uploadData = new FormData();
            uploadData.append('avatar', avatarFile);

            for (let [key, value] of uploadData.entries()) {
                console.log(`Trong FormData có: key='${key}', value=`, value);
            }

            const uploadResponse = await fetch(`${API_BASE_URL}/api/users/upload-avatar`, {
                method: 'POST',
                body: uploadData,
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Tải ảnh lên thất bại');
            }
            
            finalFormData.avatar = uploadResult.url;
        } else {
            console.log("Không phát hiện file mới, sẽ chỉ cập nhật thông tin."); 
        }

        const response = await fetch(`${API_BASE_URL}/api/customers/${customer.khach_hang_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalFormData)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || "Cập nhật thông tin khách hàng thất bại");
        }
        
        setCustomer(finalFormData as Customer);
        setIsEditing(false);
        setAvatarFile(null);
         toast.success(result.message || "Cập nhật thông tin thành công!");

    } catch (err: any) {
       toast.error(`Lỗi: ${err.message}`);
    } finally {
        setIsUploading(false);
    }
};
    
    const toInputDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    if (isLoading) return <div className="customer-detail-container"><p>Đang tải...</p></div>;
    if (error) return <div className="customer-detail-container error-message">{error}</div>;

    return (
        <>
         <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            
        
        <div className="customer-detail-container">
            <header className="customer-detail-header">
                <h1>{isEditing ? "Chỉnh sửa hồ sơ khách hàng" : "Chi tiết hồ sơ khách hàng"}</h1>
                <div>
                    {isEditing ? (
                        <>
                            <button type="button" onClick={() => setIsEditing(false)} className="action-button secondary">Hủy</button>
                            <button type="submit" form="customer-form" className="action-button">Lưu thay đổi</button>
                        </>
                    ) : (
                        <>
                            <Link to="/admin/users" className="action-button secondary">Quay lại</Link>
                            <button type="button" onClick={handleEditClick} className="action-button">Sửa thông tin</button> 
                       </>
                    )}
                </div>
            </header>
            
            <form id="customer-form" className="customer-form-grid" onSubmit={handleSaveSubmit}>
                        <div className="form-column">
                {/* Card Avatar */}
                <div className="profile-card">
                    <header className="card-header">
                        <h2>Ảnh đại diện</h2>
                    </header>
                    <div className="avatar-section">
                        <img 
                            src={avatarPreview || formData.avatar || 'https://via.placeholder.com/150'} 
                            alt="Avatar" 
                            className="avatar-image"
                        />
                        {isEditing && (
                            <>
                                <input type="file" id="avatarUpload" onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }}/>
                                <label htmlFor="avatarUpload" className="avatar-edit-button">Thay đổi ảnh</label>
                            </>
                        )}
                    </div>
                </div>

                {/* Card Thông tin tài khoản */}
                <div className="profile-card">
                    <header className="card-header">
                        <h2>Thông tin tài khoản</h2>
                    </header>
                    <div className="card-content">
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{customer?.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Tên đăng nhập</span>
                            <span className="detail-value">{customer?.ten_dang_nhap}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Vai trò</span>
                            <span className="detail-value">{customer?.vai_tro}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Trạng thái</span>
                            <span className={`detail-value status-badge ${customer?.trang_thai === 'active' ? 'status-active' : 'status-inactive'}`}>
                                {customer?.trang_thai}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Ngày tạo</span>
                            <span className="detail-value">{formatDateTime(customer?.ngay_tao || '')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CỘT BÊN PHẢI --- */}
            <div className="form-column">
                {/* Card Thông tin cá nhân */}
                <div className="profile-card">
                    <header className="card-header">
                        <h2>Thông tin cá nhân</h2>
                    </header>
                    <div className="card-content">
                        <div className="detail-item2">
                            <span className="detail-label">Họ và Tên</span>
                            {isEditing ? (<input name="ho_ten" value={formData.ho_ten || ''} onChange={handleInputChange} className="detail-input"/>) 
                                    : (<span className="detail-value">{customer?.ho_ten}</span>)}
                        </div>
                        <div className="detail-item2">
                            <span className="detail-label">Ngày sinh</span>
                            {isEditing ? (<input type="date" name="ngay_sinh" value={toInputDate(formData.ngay_sinh || '')} onChange={handleInputChange} className="detail-input"/>) 
                                    : (<span className="detail-value">{customer?.ngay_sinh ? new Date(customer.ngay_sinh).toLocaleDateString('vi-VN') : 'N/A'}</span>)}
                        </div>
                        <div className="detail-item2">
                            <span className="detail-label">Tỉnh/Thành phố</span>
                            {isEditing ? (
                                <select name="tinh" value={formData.tinh || ''} onChange={handleProvinceChange} className="detail-input">
                                    <option value="">-- Chọn Tỉnh/Thành --</option>
                                    {locations.map(p => (<option key={p.Id} value={p.Name}>{p.Name}</option>))}
                                </select>
                            ) : (<span className="detail-value">{customer?.tinh}</span>)}
                        </div>
                    <div className="detail-item2">
                        <span className="detail-label">Quận/Huyện</span>
                        {isEditing ? (
                            <select name="thanh_pho" value={formData.thanh_pho || ''} onChange={handleInputChange} className="detail-input" disabled={districts.length === 0}>
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map(d => (<option key={d.Id} value={d.Name}>{d.Name}</option>))}
                            </select>
                        ) : (<span className="detail-value">{customer?.thanh_pho}</span>)}
                    </div>
                    <div className="detail-item2">
                        <span className="detail-label">Địa chỉ (Số nhà, đường)</span>
                        {isEditing ? (<input name="dia_chi" value={formData.dia_chi || ''} onChange={handleInputChange} className="detail-input"/>) 
                                   : (<span className="detail-value">{customer?.dia_chi}</span>)}
                    </div>
                     <div className="detail-item2">
                        <span className="detail-label">Mã bưu chính</span>
                        {isEditing ? (<input name="ma_buu_chinh" value={formData.ma_buu_chinh || ''} onChange={handleInputChange} className="detail-input"/>) 
                                   : (<span className="detail-value">{customer?.ma_buu_chinh || 'N/A'}</span>)}
                    </div>
                    <div className="detail-item2">
                        <span className="detail-label">Cập nhật lần cuối</span>
                        <span className="detail-value">{formatDateTime(customer?.ngay_cap_nhat || '')}</span>
                    </div>
                </div>
            </div>
            </div>
            </form>
        </div>
        </>
    );
};
export default CustomerDetail;