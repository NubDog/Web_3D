import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import Input from '../Input/input';
import './ChangeInforKYC.css';

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

interface ChangeInforKYCProps {
    kycDocuments: KYCDocument[];
    onClose: () => void;
    onSuccess: () => void;
}

const ChangeInforKYC: React.FC<ChangeInforKYCProps> = ({ kycDocuments, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        so_giay_to: '',
        noi_cap: '',
        ngay_cap: '',
        ngay_het_han: ''
    });
    const [imageFiles, setImageFiles] = useState({
        front_image: null as File | null,
        back_image: null as File | null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = 'https://r2-api.sharkeatrice.workers.dev/api';

    // Initialize form with existing data from first document
    useEffect(() => {
        if (kycDocuments.length > 0) {
            const firstDoc = kycDocuments[0];
            setFormData({
                so_giay_to: firstDoc.so_giay_to || '',
                noi_cap: firstDoc.noi_cap || '',
                ngay_cap: firstDoc.ngay_cap || '',
                ngay_het_han: firstDoc.ngay_het_han || ''
            });
        }
    }, [kycDocuments]);

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'front_image' | 'back_image') => {
        const file = e.target.files?.[0] || null;
        
        // Validate file
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                setError('Kích thước file không được vượt quá 10MB');
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setError('Chỉ chấp nhận file ảnh định dạng JPG, PNG');
                return;
            }
        }
        
        setError(''); // Clear error if validation passes
        setImageFiles(prev => ({
            ...prev,
            [imageType]: file
        }));
    };

    // Remove uploaded image
    const removeImage = (imageType: 'front_image' | 'back_image') => {
        setImageFiles(prev => ({
            ...prev,
            [imageType]: null
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.so_giay_to || !formData.noi_cap || !formData.ngay_cap || !formData.ngay_het_han) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Get the first document to update
            const documentToUpdate = kycDocuments[0];
            if (!documentToUpdate) {
                throw new Error('Không tìm thấy tài liệu để cập nhật');
            }

            // Prepare form data for API
            const updateFormData = new FormData();
            updateFormData.append('so_giay_to', formData.so_giay_to);
            updateFormData.append('noi_cap', formData.noi_cap);
            updateFormData.append('ngay_cap', formData.ngay_cap);
            updateFormData.append('ngay_het_han', formData.ngay_het_han);
            updateFormData.append('trang_thai', 'Chờ xac thực'); // Reset status when updated
            
            // Add images if uploaded
            if (imageFiles.front_image) {
                updateFormData.append('front_image', imageFiles.front_image);
            }
            if (imageFiles.back_image) {
                updateFormData.append('back_image', imageFiles.back_image);
            }

            // Call the update API
            const response = await fetch(`${API_URL}/kyc/cccd/${documentToUpdate.khach_hang_id}`, {
                method: 'PUT',
                body: updateFormData
            });

            const result = await response.json();

            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || 'Có lỗi xảy ra khi cập nhật thông tin KYC');
            }
            
        } catch (err: any) {
            setError('Lỗi kết nối đến server: ' + (err.message || ''));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="change-infor-kyc-overlay">
        <div className="change-infor-kyc-container">
                <div className="change-infor-kyc-header">
                    <h2>Cập nhật thông tin KYC</h2>
                    <button className="close-button" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="change-infor-kyc-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="change-infor-kyc-form">
                    {/* Upload ảnh CCCD */}
                    <div className="image-upload-section">
                        <h3>Cập nhật ảnh CCCD (tùy chọn)</h3>
                        <p className="upload-note">Chỉ tải lên ảnh mới nếu bạn muốn thay đổi. Để trống nếu giữ nguyên ảnh hiện tại.</p>
                        <div className="image-upload-grid">
                            {/* CCCD mặt trước */}
                            <div className="image-upload-item">
                                <label className="image-upload-label">CCCD mặt trước</label>
                                <div className="image-upload-area">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'front_image')}
                                        className="image-file-input"
                                    />
                                    <div className="image-upload-placeholder">
                                        {imageFiles.front_image ? (
                                            <div className="image-preview">
                                                <img 
                                                    src={URL.createObjectURL(imageFiles.front_image)} 
                                                    alt="CCCD mặt trước"
                                                    className="preview-image"
                                                />
                                                <button 
                                                    type="button"
                                                    className="remove-image-btn"
                                                    onClick={() => removeImage('front_image')}
                                                >
                                                    ✕
                                                </button>
                                                <div className="image-file-info">
                                                    {imageFiles.front_image.name}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="upload-prompt">
                                                <div className="upload-icon">📷</div>
                                                <p>Chọn ảnh CCCD mặt trước</p>
                                                <span>PNG, JPG tối đa 10MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* CCCD mặt sau */}
                            <div className="image-upload-item">
                                <label className="image-upload-label">CCCD mặt sau</label>
                                <div className="image-upload-area">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'back_image')}
                                        className="image-file-input"
                                    />
                                    <div className="image-upload-placeholder">
                                        {imageFiles.back_image ? (
                                            <div className="image-preview">
                                                <img 
                                                    src={URL.createObjectURL(imageFiles.back_image)} 
                                                    alt="CCCD mặt sau"
                                                    className="preview-image"
                                                />
                                                <button 
                                                    type="button"
                                                    className="remove-image-btn"
                                                    onClick={() => removeImage('back_image')}
                                                >
                                                    ✕
                                                </button>
                                                <div className="image-file-info">
                                                    {imageFiles.back_image.name}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="upload-prompt">
                                                <div className="upload-icon">📷</div>
                                                <p>Chọn ảnh CCCD mặt sau</p>
                                                <span>PNG, JPG tối đa 10MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form thông tin */}
                    <div className="form-grid">
                        <div className="form-field">
                            <Input
                                placeholder="Số CCCD"
                                value={formData.so_giay_to}
                                type="text"
                                onChange={(e) => setFormData(prev => ({ ...prev, so_giay_to: e.target.value }))}
                            />
                        </div>

                        <div className="form-field">
                            <Input
                                placeholder="Nơi cấp"
                                value={formData.noi_cap}
                                type="text"
                                onChange={(e) => setFormData(prev => ({ ...prev, noi_cap: e.target.value }))}
                            />
                        </div>

                        <div className="form-field">
                            <Input
                                placeholder="Ngày cấp"
                                value={formData.ngay_cap}
                                type="date"
                                onChange={(e) => setFormData(prev => ({ ...prev, ngay_cap: e.target.value }))}
                            />
                        </div>

                        <div className="form-field">
                            <Input
                                placeholder="Ngày hết hạn"
                                value={formData.ngay_het_han}
                                type="date"
                                onChange={(e) => setFormData(prev => ({ ...prev, ngay_het_han: e.target.value }))}
                            />
                        </div>
        </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-button"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <Button 
                            conttent={
                                isLoading 
                                    ? "Đang cập nhật..." 
                                    : (imageFiles.front_image || imageFiles.back_image) 
                                        ? "Cập nhật thông tin & ảnh"
                                        : "Cập nhật thông tin"
                            }
                            onClick={() => {}} // Form submit sẽ handle
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeInforKYC;