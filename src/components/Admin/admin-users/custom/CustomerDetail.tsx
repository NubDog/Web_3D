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

interface KycDocument {
    tai_lieu_id: number;
    khach_hang_id: number;
    loai_giay_to: string;
    so_giay_to: string;
    duong_dan_file: string;
    noi_cap: string;
    ngay_cap: string;
    ngay_het_han: string;
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


    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
    const [isLoadingKyc, setIsLoadingKyc] = useState(false);


    const [newKycFrontFile, setNewKycFrontFile] = useState<File | null>(null);
    const [newKycBackFile, setNewKycBackFile] = useState<File | null>(null);
    const [newKycFrontPreview, setNewKycFrontPreview] = useState<string | null>(null);
    const [newKycBackPreview, setNewKycBackPreview] = useState<string | null>(null);

    const [kycModalMode, setKycModalMode] = useState<'list' | 'edit' | 'add'>('list');
    const [currentTargetDoc, setCurrentTargetDoc] = useState<Partial<KycDocument>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);


    const [editingCccdData, setEditingCccdData] = useState<Partial<KycDocument> & { frontImageUrl?: string; backImageUrl?: string }>({});
    const [editingFrontFile, setEditingFrontFile] = useState<File | null>(null);
    const [editingBackFile, setEditingBackFile] = useState<File | null>(null);
    const [editingFrontPreview, setEditingFrontPreview] = useState<string | null>(null);
    const [editingBackPreview, setEditingBackPreview] = useState<string | null>(null);

    const API_BASE_URL = 'https://r2-api.sharkeatrice.workers.dev';

    useEffect(() => {
        const fetchCustomerAndKyc = async () => {
            if (!userId) return;
            setIsLoading(true);
            setError(null);
            try {
                const customerResponse = await fetch(`${API_BASE_URL}/api/customers/by-user/${userId}`);
                const customerResult = await customerResponse.json();
                if (!customerResponse.ok || !customerResult.success) {
                    throw new Error(customerResult.error || 'Không thể tải dữ liệu khách hàng.');
                }

                const customerData = customerResult.data;
                setCustomer(customerData);
                setFormData(customerData);

                if (customerData?.khach_hang_id) {
                    const kycResponse = await fetch(`${API_BASE_URL}/api/customers/${customerData.khach_hang_id}/kyc`);
                    const kycResult = await kycResponse.json();

                    if (kycResult.success && Array.isArray(kycResult.data)) {
                        setKycDocuments(kycResult.data);
                    } else {
                        setKycDocuments([]);
                    }
                }
            } catch (err: any) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomerAndKyc();
    }, [userId]);

    const handleEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditingCccdData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditClick = (e: React.MouseEvent) => {
        if (!customer) return;
        e.preventDefault();
        // setFormData(customer);
        setFormData({ ...customer });
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

        if (finalFormData.ngay_sinh) {
            const date = new Date(finalFormData.ngay_sinh);
            finalFormData.ngay_sinh = date.toLocaleDateString('en-CA'); 
        }
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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-CA');
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    const formatDateOnly = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(new Date(dateString));
    };

    if (isLoading) return <div className="customer-detail-container"><p>Đang tải...</p></div>;
    if (error) return <div className="customer-detail-container error-message">{error}</div>;

    const handleOpenKycModal = async () => {
        if (!customer?.khach_hang_id) return;
        setIsKycModalOpen(true);
        setIsLoadingKyc(true);
        setKycModalMode('list');
        try {
            const response = await fetch(`${API_BASE_URL}/api/customers/${customer.khach_hang_id}/kyc`);
            const result = await response.json();
            setKycDocuments(result.success && Array.isArray(result.data) ? result.data : []);
        } catch (error) { toast.error("Lỗi kết nối khi tải KYC."); }
        finally { setIsLoadingKyc(false); }
    };

    const handleCloseKycModal = () => {
        setIsKycModalOpen(false);

        setKycModalMode('list');
        setCurrentTargetDoc({});
        setSelectedFile(null);
        setSelectedFilePreview(null);
        setNewKycFrontFile(null);
        setNewKycBackFile(null);
        setNewKycFrontPreview(null);
        setNewKycBackPreview(null);
    };

    const handleStartAddNew = () => {
        setKycModalMode('add');
        setCurrentTargetDoc({
            so_giay_to: '',
            noi_cap: '',
            ngay_cap: '',
            ngay_het_han: ''
        });
        setEditingFrontFile(null);
        setEditingBackFile(null);
        setEditingFrontPreview(null);
        setEditingBackPreview(null);
    };

    const validateCccdLength = (cccd: string | undefined | null): boolean => {
        if (!cccd || cccd.trim() === '') {
            toast.error("Vui lòng không để trống số CCCD.");
            return false;
        }

        if (cccd.length !== 12) {
            toast.error("Số CCCD phải có đúng 12 chữ số.");
            return false;
        }

        return true;
    };

    const handleStartEdit = (doc: KycDocument) => {
        const frontDoc = kycDocuments.find(d => d.loai_giay_to === 'CCCD_TRUOC');
        const backDoc = kycDocuments.find(d => d.loai_giay_to === 'CCCD_SAU');

        setKycModalMode('edit');
        setCurrentTargetDoc(doc);

        setEditingFrontFile(null);
        setEditingBackFile(null);
        setEditingFrontPreview(frontDoc?.duong_dan_file || null);
        setEditingBackPreview(backDoc?.duong_dan_file || null);
    };
    const handleReturnToList = () => {
        setKycModalMode('list');
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentTargetDoc(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setSelectedFilePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSaveKyc = async () => {
        if (!customer?.khach_hang_id) {
            toast.error("Lỗi: Không tìm thấy ID khách hàng.");
            return;
        }


        const cccdNumber = currentTargetDoc.so_giay_to;
        const isAdding = kycModalMode === 'add';
        const formData = new FormData();
        const url = isAdding
            ? `${API_BASE_URL}/api/kyc`
            : `${API_BASE_URL}/api/kyc/cccd/${customer.khach_hang_id}`;
        const method = isAdding ? 'POST' : 'PUT';

        if (isAdding) {
            if (!editingFrontFile || !editingBackFile) {
                toast.error("Vui lòng chọn đủ ảnh mặt trước và sau.");
                return;
            }
            formData.append('khach_hang_id', String(customer.khach_hang_id));
        }

        if (!validateCccdLength(cccdNumber)) {
            return;
        }

        if (editingFrontFile) formData.append('front_image', editingFrontFile);
        if (editingBackFile) formData.append('back_image', editingBackFile);

        Object.entries(currentTargetDoc).forEach(([key, value]) => {
            if (method === 'PUT' && ['tai_lieu_id', 'khach_hang_id', 'duong_dan_file', 'ngay_tao'].includes(key)) {
                return;
            }
            formData.append(key, String(value || ''));
        });



        // Gửi request
        try {
            const response = await fetch(url, { method, body: formData });
            const result = await response.json();

            if (result.success) {
                toast.success(`Đã ${isAdding ? 'thêm' : 'cập nhật'} thành công!`);
                handleOpenKycModal(); // Tải lại và quay về danh sách
            } else {
                throw new Error(result.error || result.details || 'Thao tác thất bại');
            }
        } catch (err: any) {
            toast.error(`Lỗi: ${err.message}`);
        }
    };

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
                                        <input type="file" id="avatarUpload" onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />
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
                                    <span className={`detail-value status-badge ${customer?.trang_thai === 'active' ? 'status-active' : 'status-inactive'}`} style={{color: 'black'}}>
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
                                    {isEditing ? (<input name="ho_ten" value={formData.ho_ten || ''} onChange={handleInputChange} className="detail-input" />)
                                        : (<span className="detail-value">{customer?.ho_ten}</span>)}
                                </div>
                               <div className="detail-item2">
                                    <span className="detail-label">Ngày sinh</span>
                                    {isEditing ? (
                                        <input 
                                            type="date" 
                                            name="ngay_sinh" 
                                            value={toInputDate(formData.ngay_sinh || '')} 
                                            onChange={handleInputChange} 
                                            className="detail-input" 
                                        />
                                    ) : (
                                        <span className="detail-value">
                                            {formatDateOnly(customer?.ngay_sinh || '')}
                                        </span>
                                    )}
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
                                    {isEditing ? (<input name="dia_chi" value={formData.dia_chi || ''} onChange={handleInputChange} className="detail-input" />)
                                        : (<span className="detail-value">{customer?.dia_chi}</span>)}
                                </div>
                                <div className="detail-item2">
                                    <span className="detail-label">Mã bưu chính</span>
                                    {isEditing ? (<input name="ma_buu_chinh" value={formData.ma_buu_chinh || ''} onChange={handleInputChange} className="detail-input" />)
                                        : (<span className="detail-value">{customer?.ma_buu_chinh || 'N/A'}</span>)}
                                </div>
                                <div className="detail-item2">
                                    <span className="detail-label">Cập nhật lần cuối</span>
                                    <span className="detail-value">{formatDateTime(customer?.ngay_cap_nhat || '')}</span>
                                </div>
                                <button type="button" onClick={handleOpenKycModal} className="action-button secondary" style={{ marginTop: '16px', width: '100%' }}>
                                    Xem/Quản lý KYC
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                {isKycModalOpen && (
                    <div className="modal-overlay" onClick={handleCloseKycModal}>
                        <div className="modal-content kyc-modal" onClick={(e) => e.stopPropagation()}>
                            <header className="modal-header">
                                <h2>
                                    {kycModalMode === 'list' && `Hồ sơ KYC của "${customer?.ho_ten}"`}
                                    {kycModalMode === 'add' && 'Thêm tài liệu KYC mới'}
                                    {kycModalMode === 'edit' && `Chỉnh sửa tài liệu #${currentTargetDoc.tai_lieu_id}`}
                                </h2>
                                <button onClick={handleCloseKycModal} className="close-button">&times;</button>
                            </header>

                            <div className="modal-body">
                                {isLoadingKyc ? <p style={{ textAlign: 'center' }}>Đang tải...</p> : (
                                    <>
                                        {/* CHẾ ĐỘ XEM DANH SÁCH */}
                                        {kycModalMode === 'list' && (
                                            <div className="kyc-list-view">
                                                {kycDocuments.length === 0 ?
                                                    <div className="kyc-list-actions">
                                                        <button onClick={handleStartAddNew} className="action-button">+ Thêm mới</button>
                                                    </div>
                                                    :
                                                    null
                                                }
                                                <div className="kyc-document-list">
                                                    {kycDocuments.length > 0 ? kycDocuments.map((doc, index) => (
                                                        <div key={doc.tai_lieu_id} className="kyc-document-item-admin">
                                                            <a href={doc.duong_dan_file} target="_blank" rel="noopener noreferrer"><img src={doc.duong_dan_file} alt={doc.loai_giay_to} className="kyc-admin-preview" /></a>
                                                            <div className="kyc-doc-info">
                                                                <p>{index === 1 ? "Mặt sau" : "Mặt trước"}</p>
                                                                <p><strong>{doc.loai_giay_to}</strong></p>
                                                                <p>Số: {doc.so_giay_to || 'N/A'}</p>
                                                                <p>Trạng thái: <span className={`status-badge status-${doc.trang_thai?.toLowerCase()}`} style={{color: 'black'}}>{doc.trang_thai}</span></p>
                                                            </div>
                                                            <div className="kyc-doc-actions">
                                                                <button onClick={() => handleStartEdit(doc)} className="action-button secondary">Sửa</button>
                                                            </div>
                                                        </div>
                                                    )) : <p>Chưa có tài liệu KYC nào.</p>}
                                                </div>
                                            </div>
                                        )}

                                        {/* CHẾ ĐỘ SỬA HOẶC THÊM MỚI */}
                                        {(kycModalMode === 'add' || kycModalMode === 'edit') && (
                                            <div className="kyc-form-view">
                                                <div className="kyc-upload-columns">
                                                    <div className="kyc-edit-image-section">
                                                        <label htmlFor="kycFrontFile" className="kyc-image-upload-wrapper">
                                                            <img
                                                                src={editingFrontPreview || 'https://via.placeholder.com/200x126.png?text=Mặt+trước'}
                                                                alt="Mặt trước"
                                                                className="kyc-admin-preview"
                                                            />
                                                            <div className="image-upload-overlay"><span>{kycModalMode === 'add' ? 'Chọn' : 'Thay đổi'} mặt trước</span></div>
                                                        </label>
                                                        <input
                                                            id="kycFrontFile"
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setEditingFrontFile(e.target.files[0]);
                                                                    setEditingFrontPreview(URL.createObjectURL(e.target.files[0]));
                                                                }
                                                            }}
                                                            style={{ display: 'none' }}
                                                            accept="image/*"
                                                        />
                                                    </div>

                                                    <div className="kyc-edit-image-section">
                                                        <label htmlFor="kycBackFile" className="kyc-image-upload-wrapper">
                                                            <img
                                                                src={editingBackPreview || 'https://via.placeholder.com/200x126.png?text=Mặt+sau'}
                                                                alt="Mặt sau"
                                                                className="kyc-admin-preview"
                                                            />
                                                            <div className="image-upload-overlay"><span>{kycModalMode === 'add' ? 'Chọn' : 'Thay đổi'} mặt sau</span></div>
                                                        </label>
                                                        <input
                                                            id="kycBackFile"
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setEditingBackFile(e.target.files[0]);
                                                                    setEditingBackPreview(URL.createObjectURL(e.target.files[0]));
                                                                }
                                                            }}
                                                            style={{ display: 'none' }}
                                                            accept="image/*"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="kyc-edit-fields">
                                                    <div className="detail-item-modal">
                                                        <span className="detail-label">Số giấy tờ</span>
                                                        <input name="so_giay_to" value={currentTargetDoc.so_giay_to || ''} onChange={handleFormChange} maxLength={12} className="detail-input" />
                                                    </div>
                                                    <div className="detail-item-modal">
                                                        <span className="detail-label">Nơi cấp</span>
                                                        <input name="noi_cap" value={currentTargetDoc.noi_cap || ''} onChange={handleFormChange} className="detail-input" />
                                                    </div>
                                                    <div className="detail-item-modal">
                                                        <span className="detail-label">Ngày cấp</span>
                                                        <input type="date" name="ngay_cap" value={toInputDate(currentTargetDoc.ngay_cap || '')} onChange={handleFormChange} className="detail-input" />
                                                    </div>
                                                    <div className="detail-item-modal">
                                                        <span className="detail-label">Ngày hết hạn</span>
                                                        <input type="date" name="ngay_het_han" value={toInputDate(currentTargetDoc.ngay_het_han || '')} onChange={handleFormChange} className="detail-input" />
                                                    </div>

                                                    {kycModalMode === 'edit' && (
                                                        <div className="detail-item-modal">
                                                            <span className="detail-label">Trạng thái</span>
                                                            <select name="trang_thai" value={currentTargetDoc.trang_thai || ''} onChange={handleFormChange} className="detail-input">
                                                                <option value="Pending">Chưa xác thực</option>
                                                                <option value="Verified">Đã xác thực</option>
                                                                <option value="Rejected">Bị từ chối</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="kyc-form-actions">
                                                    <button onClick={handleReturnToList} className="action-button secondary">Quay lại</button>
                                                    <button onClick={handleSaveKyc} className="action-button">Lưu</button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
export default CustomerDetail;