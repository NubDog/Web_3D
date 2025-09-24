import React, { useState, useEffect, type ChangeEvent} from 'react';
import './css/vipham.css'
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
    initialData?: any | null;
}

const defaultFormState = {
    don_thue_id: '',
    loai_vi_pham: '',
    thoi_gian_xay_ra: '',
    so_tien_phat: 0,
    ghi_chu: '',
    trang_thai: 'chua_xu_ly', 
    co_quan_xu_ly: '',
};

const ViolationFormModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }) => {
    const [formData, setFormData] = useState(defaultFormState);
    const [chungFile, setChungFile] = useState<File | null>(null);
    const [chungPreview, setChungPreview] = useState<string>('');

    useEffect(() => {
        if (isOpen) { 
            if (initialData) {
                setFormData({
                    don_thue_id: initialData.don_thue_id || '',
                    loai_vi_pham: initialData.loai_vi_pham || '',
                    thoi_gian_xay_ra: initialData.thoi_gian_xay_ra ? initialData.thoi_gian_xay_ra.slice(0, 16) : '',
                    so_tien_phat: initialData.so_tien_phat || 0,
                    ghi_chu: initialData.ghi_chu || '',
                    trang_thai: initialData.trang_thai || 'chua_xu_ly',
                    co_quan_xu_ly: initialData.co_quan_xu_ly || '',
                });
                setChungFile(null);
                setChungPreview(initialData.duong_dan_bang_chung || '');
            } else {
                setFormData(defaultFormState);
            }
        }
    }, [initialData, isOpen]);

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setChungFile(file);
            setChungPreview(URL.createObjectURL(file));
        }
    };

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let submissionData: any;

        if (initialData) {
            submissionData = {
                trang_thai: formData.trang_thai,
                so_tien_phat: parseFloat(String(formData.so_tien_phat)) || 0,
                ghi_chu: formData.ghi_chu,
                co_quan_xu_ly: formData.co_quan_xu_ly,
            };
        } else {
            submissionData = { ...formData, bang_chung: chungFile };
        }
        
        onSubmit(submissionData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                 <h2>{initialData ? 'Cập nhật Vi phạm' : 'Ghi Nhận Vi phạm Mới'}</h2>
                <form onSubmit={handleSubmit}>
                    
                    {/* Các trường này chỉ hiển thị và bắt buộc khi Thêm mới */}
                    {!initialData && (
                        <>
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
                                <input type="datetime-local" name="thoi_gian_xay_ra" value={formData.thoi_gian_xay_ra} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Ảnh bằng chứng (tùy chọn)</label>
                                <div className="file-uploader">
                                    <input id="file-upload" type="file" name="bang_chung" onChange={handleFileChange} accept="image/*" />
                                    <label htmlFor="file-upload" className="file-upload-label">
                                        {chungPreview ? <img src={chungPreview} alt="Xem trước" className="file-preview" /> : <span>Chọn ảnh</span>}
                                    </label>
                                </div>
                            </div>
                        
                        </>
                    )}

                    {/* Các trường này luôn hiển thị cho cả Thêm và Sửa */}
                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select name="trang_thai" value={formData.trang_thai} onChange={handleChange}>
                            <option value="chua_xu_ly">Chưa xử lý</option>
                            <option value="da_thanh_toan">Đã thanh toán</option>
                            <option value="huy_bo">Hủy bỏ</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Cơ quan xử lý</label>
                        <input type="text" name="co_quan_xu_ly" value={formData.co_quan_xu_ly} onChange={handleChange} placeholder="Ví dụ: CSGT Quận Hải Châu" />
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
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ViolationFormModal;