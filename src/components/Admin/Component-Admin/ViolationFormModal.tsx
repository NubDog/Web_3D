import React, { useState } from 'react';
import './css/ReturnVehicleModal.css'; 

interface ViolationData {
  don_thue_id: number;
  loai_vi_pham: string;
  so_tien_phat: number;
  thoi_gian_xay_ra: string;
  ghi_chu: string;
}

interface ViolationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ViolationData) => void;
  isSubmitting: boolean;
}

const ViolationFormModal: React.FC<ViolationFormModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [donThueId, setDonThueId] = useState<number>(0);
  const [loaiViPham, setLoaiViPham] = useState('');
  const [soTienPhat, setSoTienPhat] = useState<number>(0);
  const [thoiGian, setThoiGian] = useState('');
  const [ghiChu, setGhiChu] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isoDateTime = thoiGian ? new Date(thoiGian).toISOString() : '';
    onSubmit({
      don_thue_id: donThueId,
      loai_vi_pham: loaiViPham,
      so_tien_phat: soTienPhat,
      thoi_gian_xay_ra: isoDateTime,
      ghi_chu: ghiChu,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Ghi Nhận Vi Phạm Mới</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="don_thue_id">ID Đơn Thuê liên quan</label>
              <input id="don_thue_id" type="number" onChange={(e) => setDonThueId(Number(e.target.value))} required />
            </div>
            <div className="form-group">
              <label htmlFor="loai_vi_pham">Loại vi phạm</label>
              <input id="loai_vi_pham" type="text" value={loaiViPham} onChange={(e) => setLoaiViPham(e.target.value)} required placeholder="Ví dụ: Vượt đèn đỏ, Phạt nguội..." />
            </div>
             <div className="form-group">
              <label htmlFor="thoi_gian_xay_ra">Thời gian xảy ra</label>
              <input id="thoi_gian_xay_ra" type="datetime-local" value={thoiGian} onChange={(e) => setThoiGian(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="so_tien_phat">Số tiền phạt (VND)</label>
              <input id="so_tien_phat" type="number" min="0" value={soTienPhat} onChange={(e) => setSoTienPhat(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label htmlFor="ghi_chu">Ghi chú</label>
              <textarea id="ghi_chu" rows={3} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Vi Phạm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViolationFormModal;