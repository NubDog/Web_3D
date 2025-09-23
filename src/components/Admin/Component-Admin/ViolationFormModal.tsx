import React, { useState } from 'react';
import './css/vipham.css'
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
}

const ViolationFormModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        don_thue_id: '',
        loai_vi_pham: '',
        thoi_gian_xay_ra: '',
        so_tien_phat: 0,
        ghi_chu: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submissionData = {
            ...formData,
            don_thue_id: parseInt(formData.don_thue_id) || null,
            so_tien_phat: parseFloat(String(formData.so_tien_phat)) || 0,
            thoi_gian_xay_ra: formData.thoi_gian_xay_ra
                ? new Date(formData.thoi_gian_xay_ra).toISOString()
                : null 
        };
        
        onSubmit(submissionData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Ghi Nhận Vi Phạm Mới</h2>
                <form onSubmit={handleSubmit}>
                    {/* Các ô nhập liệu cho form */}
                    <div className="form-group">
                        <label>ID Đơn thuê</label>
                        <input type="number" name="don_thue_id" value={formData.don_thue_id} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Loại vi phạm</label>
                        <input type="text" name="loai_vi_pham" value={formData.loai_vi_pham} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Thời gian xảy ra</label>
                        <input
                            type="datetime-local" 
                            name="thoi_gian_xay_ra"
                            value={formData.thoi_gian_xay_ra}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Số tiền phạt</label>
                        <input type="number" name="so_tien_phat" value={formData.so_tien_phat} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Ghi chú</label>
                        <textarea name="ghi_chu" value={formData.ghi_chu} onChange={handleChange}></textarea>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} disabled={isSubmitting}>Hủy</button>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang lưu...' : 'Lưu Vi Phạm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ViolationFormModal;