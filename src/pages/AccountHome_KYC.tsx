import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/header';
import Footer from '../components/Footer/Footer';
import Button from '../components/Button/Button';
import { useAuth } from '../contexts/AuthContext';
import ChangeInforKYC from '../components/ChangeInforKYC/ChangeInforKYC';
import './../styles/pages/AccountHome_KYC/AccountHome_KYC.css';

interface KYCDocument {
    tai_lieu_id: number;
    khach_hang_id: number;
    loai_giay_to: string;
    so_giay_to: string;
    duong_dan_file: string;
    ma_bam_file: string;
    noi_cap: string;
    ngay_cap: string;
    ngay_het_han: string;
    trang_thai: string;
    ngay_tao: string;
    ngay_xac_thuc: string;
    xac_thuc_boi: number;
}

const AccountHome_KYC = () => {
    const { currentUser } = useAuth();
    const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        so_giay_to: '',
        noi_cap: '',
        ngay_cap: '',
        ngay_het_han: ''
    });

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        so_giay_to: '',
        noi_cap: '',
        ngay_cap: '',
        ngay_het_han: '',
        front_image: null as File | null,
        back_image: null as File | null
    });

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api';

    // Fetch KYC documents
    useEffect(() => {
        const fetchKycDocuments = async () => {
            if (!currentUser?.nguoi_dung_id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/kyc/user/${currentUser.nguoi_dung_id}`);
                const result = await response.json();

                if (result.success) {
                    setKycDocuments(result.data || []);
                } else {
                    setError(result.error || 'Không thể tải thông tin KYC');
                }
            } catch (err: any) {
                setError('Lỗi kết nối đến server');
            } finally {
                setIsLoading(false);
            }
        };

        fetchKycDocuments();
    }, [currentUser]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent, documentId: number) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            // Find the document being edited to get khach_hang_id
            const document = kycDocuments.find(doc => doc.tai_lieu_id === documentId);
            if (!document) {
                throw new Error('Không tìm thấy tài liệu');
            }

            // Prepare form data for API
            const updateFormData = new FormData();
            updateFormData.append('so_giay_to', formData.so_giay_to);
            updateFormData.append('noi_cap', formData.noi_cap);
            updateFormData.append('ngay_cap', formData.ngay_cap);
            updateFormData.append('ngay_het_han', formData.ngay_het_han);
            updateFormData.append('trang_thai', 'Chờ xac thực'); // Reset status when updated

            // Call the update API
            const response = await fetch(`${API_URL}/kyc/cccd/${document.khach_hang_id}`, {
                method: 'PUT',
                body: updateFormData
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage('Cập nhật thông tin KYC thành công!');
                setIsEditing(null);
                
                // Refresh the KYC data
                const refreshResponse = await fetch(`${API_URL}/kyc/user/${currentUser?.nguoi_dung_id}`);
                const refreshResult = await refreshResponse.json();
                if (refreshResult.success) {
                    setKycDocuments(refreshResult.data || []);
                }
            } else {
                setError(result.error || 'Có lỗi xảy ra khi cập nhật thông tin KYC');
            }
            
        } catch (err: any) {
            setError('Lỗi kết nối đến server: ' + (err.message || ''));
        } finally {
            setSaving(false);
        }
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Start editing a document
    const startEditing = (document: KYCDocument) => {
        setIsEditing(document.tai_lieu_id);
        setFormData({
            so_giay_to: document.so_giay_to || '',
            noi_cap: document.noi_cap || '',
            ngay_cap: document.ngay_cap || '',
            ngay_het_han: document.ngay_het_han || ''
        });
    };

    // Cancel editing
    const cancelEditing = () => {
        setIsEditing(null);
        setFormData({
            so_giay_to: '',
            noi_cap: '',
            ngay_cap: '',
            ngay_het_han: ''
        });
    };

    // Get status display text
    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'verified':
                return 'Đã xác thực';
            case 'pending':
            case 'chờ xac thực':
                return 'Chờ xác thực';
            case 'rejected':
                return 'Bị từ chối';
            default:
                return status || 'Chưa xác định';
        }
    };

    // Get status CSS class
    const getStatusClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'verified':
                return 'verified';
            case 'pending':
            case 'chờ xac thực':
                return 'pending';
            case 'rejected':
                return 'rejected';
            default:
                return 'pending';
        }
    };

    // Get document type display text
    const getDocumentTypeText = (type: string) => {
        switch (type) {
            case 'CCCD_TRUOC':
                return 'CCCD mặt trước';
            case 'CCCD_SAU':
                return 'CCCD mặt sau';
            default:
                return type;
        }
    };

    // Handle upload form input changes
    const handleUploadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUploadForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle file input changes
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'front_image' | 'back_image') => {
        const file = e.target.files?.[0] || null;
        setUploadForm(prev => ({
            ...prev,
            [imageType]: file
        }));
    };

    // Get khach_hang_id from nguoi_dung_id
    const getKhachHangId = async (): Promise<number | null> => {
        try {
            const response = await fetch(`${API_URL}/customers/by-user/${currentUser?.nguoi_dung_id}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                return result.data.khach_hang_id;
            }
            return null;
        } catch (err) {
            console.error('Lỗi khi lấy khach_hang_id:', err);
            return null;
        }
    };

    // Handle upload form submission
    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!uploadForm.front_image || !uploadForm.back_image) {
            setError('Vui lòng chọn cả hai ảnh CCCD mặt trước và mặt sau');
            return;
        }

        if (!uploadForm.so_giay_to || !uploadForm.noi_cap || !uploadForm.ngay_cap || !uploadForm.ngay_het_han) {
            setError('Vui lòng điền đầy đủ thông tin CCCD');
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccessMessage('');

        try {
            // Get khach_hang_id
            const khachHangId = await getKhachHangId();
            if (!khachHangId) {
                throw new Error('Không tìm thấy thông tin khách hàng. Vui lòng liên hệ hỗ trợ.');
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('front_image', uploadForm.front_image);
            formData.append('back_image', uploadForm.back_image);
            formData.append('khach_hang_id', khachHangId.toString());
            formData.append('so_giay_to', uploadForm.so_giay_to);
            formData.append('noi_cap', uploadForm.noi_cap);
            formData.append('ngay_cap', uploadForm.ngay_cap);
            formData.append('ngay_het_han', uploadForm.ngay_het_han);

            // Call API
            const response = await fetch(`${API_URL}/kyc`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage('Tải lên thông tin KYC thành công! Tài liệu của bạn đang được xử lý.');
                
                // Reset form
                setUploadForm({
                    so_giay_to: '',
                    noi_cap: '',
                    ngay_cap: '',
                    ngay_het_han: '',
                    front_image: null,
                    back_image: null
                });

                // Refresh KYC data
                setTimeout(async () => {
                    const refreshResponse = await fetch(`${API_URL}/kyc/user/${currentUser?.nguoi_dung_id}`);
                    const refreshResult = await refreshResponse.json();
                    if (refreshResult.success) {
                        setKycDocuments(refreshResult.data || []);
                    }
                }, 1000);
            } else {
                setError(result.error || 'Có lỗi xảy ra khi tải lên thông tin KYC');
            }
        } catch (err: any) {
            setError('Lỗi kết nối đến server: ' + (err.message || ''));
        } finally {
            setIsUploading(false);
        }
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
            <div className="account-home-kyc-container">
                <Header />
                <div className="account-home-kyc-not-logged-in">
                    <div className="account-home-kyc-login-prompt">
                        <h2>Vui lòng đăng nhập</h2>
                        <p>Bạn cần đăng nhập để xem thông tin KYC</p>
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
            <div className="account-home-kyc-container">
                <Header />
                <div className="account-home-kyc-loading">
                    <h2>Đang tải thông tin KYC...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="account-home-kyc-container">
            <Header />
            <div className="account-home-kyc-content">
                <div className="account-home-kyc-profile">
                    <div className="account-home-kyc-header">
                        <h1>Thông tin định danh KYC</h1>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/account_home">
                                <Button conttent="Quay lại" />
                            </Link>
                            {kycDocuments.length > 0 && (
                                <Button 
                                    conttent="Cập nhật thông tin KYC" 
                                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                                />
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="account-home-kyc-error">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="account-home-kyc-success">
                            {successMessage}
                        </div>
                    )}

                    {kycDocuments.length === 0 ? (
                        <div className="account-home-kyc-upload-section">
                            <div className="account-home-kyc-upload-header">
                                <h3>Tải lên thông tin CCCD</h3>
                                <p>Vui lòng tải lên ảnh CCCD và điền thông tin để hoàn thành quy trình xác thực danh tính.</p>
                            </div>

                            <form onSubmit={handleUploadSubmit} className="account-home-kyc-upload-form">
                                {/* Upload ảnh */}
                                <div className="account-home-kyc-upload-images">
                                    <div className="account-home-kyc-upload-image-section">
                                        <label className="account-home-kyc-upload-label">
                                            CCCD mặt trước *
                                        </label>
                                        <div className="account-home-kyc-upload-area">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'front_image')}
                                                className="account-home-kyc-file-input"
                                                required
                                            />
                                            <div className="account-home-kyc-upload-placeholder">
                                                {uploadForm.front_image ? (
                                                    <div className="account-home-kyc-file-preview">
                                                        <img 
                                                            src={URL.createObjectURL(uploadForm.front_image)} 
                                                            alt="CCCD mặt trước"
                                                            className="account-home-kyc-preview-image"
                                                        />
                                                        <div className="account-home-kyc-file-info">
                                                            {uploadForm.front_image.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="account-home-kyc-upload-prompt">
                                                        <div className="account-home-kyc-upload-icon">📷</div>
                                                        <p>Chọn ảnh CCCD mặt trước</p>
                                                        <span>PNG, JPG tối đa 10MB</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="account-home-kyc-upload-image-section">
                                        <label className="account-home-kyc-upload-label">
                                            CCCD mặt sau *
                                        </label>
                                        <div className="account-home-kyc-upload-area">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'back_image')}
                                                className="account-home-kyc-file-input"
                                                required
                                            />
                                            <div className="account-home-kyc-upload-placeholder">
                                                {uploadForm.back_image ? (
                                                    <div className="account-home-kyc-file-preview">
                                                        <img 
                                                            src={URL.createObjectURL(uploadForm.back_image)} 
                                                            alt="CCCD mặt sau"
                                                            className="account-home-kyc-preview-image"
                                                        />
                                                        <div className="account-home-kyc-file-info">
                                                            {uploadForm.back_image.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="account-home-kyc-upload-prompt">
                                                        <div className="account-home-kyc-upload-icon">📷</div>
                                                        <p>Chọn ảnh CCCD mặt sau</p>
                                                        <span>PNG, JPG tối đa 10MB</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form thông tin */}
                                <div className="account-home-kyc-form-grid">
                                    <div className="account-home-kyc-field">
                                        <label>Số CCCD *</label>
                                        <input 
                                            type="text" 
                                            name="so_giay_to"
                                            value={uploadForm.so_giay_to}
                                            onChange={handleUploadInputChange}
                                            placeholder="Nhập số CCCD"
                                            required
                                        />
                                    </div>

                                    <div className="account-home-kyc-field">
                                        <label>Nơi cấp *</label>
                                        <input 
                                            type="text" 
                                            name="noi_cap"
                                            value={uploadForm.noi_cap}
                                            onChange={handleUploadInputChange}
                                            placeholder="Ví dụ: Cục Cảnh sát QLHC về TTXH"
                                            required
                                        />
                                    </div>

                                    <div className="account-home-kyc-field">
                                        <label>Ngày cấp *</label>
                                        <input 
                                            type="date" 
                                            name="ngay_cap"
                                            value={uploadForm.ngay_cap}
                                            onChange={handleUploadInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="account-home-kyc-field">
                                        <label>Ngày hết hạn *</label>
                                        <input 
                                            type="date" 
                                            name="ngay_het_han"
                                            value={uploadForm.ngay_het_han}
                                            onChange={handleUploadInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="account-home-kyc-upload-actions">
                                    <Button 
                                        conttent={isUploading ? "Đang tải lên..." : "Tải lên thông tin KYC"}
                                        onClick={() => {}} // Form submit sẽ handle
                                    />
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="account-home-kyc-documents">
                            {/* Form cập nhật thông tin KYC */}
                            {showUpdateForm && (
                                <ChangeInforKYC 
                                    kycDocuments={kycDocuments}
                                    onClose={() => setShowUpdateForm(false)}
                                    onSuccess={() => {
                                        // Refresh KYC data after successful update
                                        const fetchKycDocuments = async () => {
                                            if (!currentUser?.nguoi_dung_id) return;
                                            try {
                                                const response = await fetch(`${API_URL}/kyc/user/${currentUser.nguoi_dung_id}`);
                                                const result = await response.json();
                                                if (result.success) {
                                                    setKycDocuments(result.data || []);
                                                    setSuccessMessage('Cập nhật thông tin KYC thành công!');
                                                }
                                            } catch (err) {
                                                setError('Lỗi kết nối đến server');
                                            }
                                        };
                                        fetchKycDocuments();
                                        setShowUpdateForm(false);
                                    }}
                                />
                            )}
                            
                            {/* Hiển thị tối đa 2 ảnh KYC */}
                            {kycDocuments.slice(0, 2).map((document) => (
                                <div key={document.tai_lieu_id} className="account-home-kyc-document">
                                    <div className="account-home-kyc-document-header">
                                        <h3 className="account-home-kyc-document-title">
                                            {getDocumentTypeText(document.loai_giay_to)}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span className={`account-home-kyc-status ${getStatusClass(document.trang_thai)}`}>
                                                {getStatusText(document.trang_thai)}
                                            </span>
                                            {!isEditing && (
                                                <Button
                                                    conttent="Chỉnh sửa"
                                                    onClick={() => startEditing(document)}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <form onSubmit={(e) => handleSubmit(e, document.tai_lieu_id)} className="account-home-kyc-form">
                                        <div className="account-home-kyc-form-grid">
                                            {/* Số giấy tờ */}
                                            <div className="account-home-kyc-field">
                                                <label>Số giấy tờ</label>
                                                <input 
                                                    type="text" 
                                                    name="so_giay_to"
                                                    value={isEditing === document.tai_lieu_id ? formData.so_giay_to : document.so_giay_to}
                                                    onChange={handleInputChange}
                                                    disabled={isEditing !== document.tai_lieu_id}
                                                />
                                            </div>

                                            {/* Nơi cấp */}
                                            <div className="account-home-kyc-field">
                                                <label>Nơi cấp</label>
                                                <input 
                                                    type="text" 
                                                    name="noi_cap"
                                                    value={isEditing === document.tai_lieu_id ? formData.noi_cap : document.noi_cap}
                                                    onChange={handleInputChange}
                                                    disabled={isEditing !== document.tai_lieu_id}
                                                />
                                            </div>

                                            {/* Ngày cấp */}
                                            <div className="account-home-kyc-field">
                                                <label>Ngày cấp</label>
                                                <input 
                                                    type="date" 
                                                    name="ngay_cap"
                                                    value={isEditing === document.tai_lieu_id ? formData.ngay_cap : document.ngay_cap}
                                                    onChange={handleInputChange}
                                                    disabled={isEditing !== document.tai_lieu_id}
                                                />
                                            </div>

                                            {/* Ngày hết hạn */}
                                            <div className="account-home-kyc-field">
                                                <label>Ngày hết hạn</label>
                                                <input 
                                                    type="date" 
                                                    name="ngay_het_han"
                                                    value={isEditing === document.tai_lieu_id ? formData.ngay_het_han : document.ngay_het_han}
                                                    onChange={handleInputChange}
                                                    disabled={isEditing !== document.tai_lieu_id}
                                                />
                                            </div>

                                            {/* Ngày tạo - Read only */}
                                            <div className="account-home-kyc-field">
                                                <label>Ngày tạo</label>
                                                <input 
                                                    type="text" 
                                                    value={document.ngay_tao ? new Date(document.ngay_tao).toLocaleDateString('vi-VN') : ''}
                                                    disabled
                                                />
                                            </div>

                                            {/* Ngày xác thực - Read only */}
                                            <div className="account-home-kyc-field">
                                                <label>Ngày xác thực</label>
                                                <input 
                                                    type="text" 
                                                    value={document.ngay_xac_thuc ? new Date(document.ngay_xac_thuc).toLocaleDateString('vi-VN') : 'Chưa xác thực'}
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        {/* Image display */}
                                        {document.duong_dan_file && (
                                            <div className="account-home-kyc-images">
                                                <div className="account-home-kyc-image-container">
                                                    <img 
                                                        src={document.duong_dan_file} 
                                                        alt={getDocumentTypeText(document.loai_giay_to)}
                                                        className="account-home-kyc-image"
                                                    />
                                                    <div className="account-home-kyc-image-label">
                                                        {getDocumentTypeText(document.loai_giay_to)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isEditing === document.tai_lieu_id && (
                                            <div className="account-home-kyc-form-actions">
                                                <button 
                                                    type="button"
                                                    className="account-home-kyc-cancel-btn"
                                                    onClick={cancelEditing}
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AccountHome_KYC;