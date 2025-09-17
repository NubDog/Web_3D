

import React, { useState } from 'react';
import './css/ReturnVehicleModal.css'; 

interface ReturnVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { so_km_tra: string; muc_xang_tra: string; ghi_chu_hu_hong_moi: string }) => void;
  isSubmitting: boolean;
}

const ReturnVehicleModal: React.FC<ReturnVehicleModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [so_km, setSoKm] = useState('');
  const [muc_xang, setMucXang] = useState('Đầy bình');
  const [ghi_chu, setGhiChu] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      so_km_tra: so_km,
      muc_xang_tra: muc_xang,
      ghi_chu_hu_hong_moi: ghi_chu,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Tiếp Nhận Xe Trả</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="so_km">Số KM lúc trả</label>
              <input
                id="so_km"
                type="number"
                value={so_km}
                onChange={(e) => setSoKm(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="muc_xang">Mức xăng</label>
              <select id="muc_xang" value={muc_xang} onChange={(e) => setMucXang(e.target.value)}>
                <option value="Rỗng">Rỗng</option>
                <option value="1/4">1/4 bình</option>
                <option value="1/2">1/2 bình</option>
                <option value="3/4">3/4 bình</option>
                <option value="Đầy bình">Đầy bình</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ghi_chu">Ghi chú hư hỏng mới (nếu có)</label>
              <textarea
                id="ghi_chu"
                rows={3}
                value={ghi_chu}
                onChange={(e) => setGhiChu(e.target.value)}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnVehicleModal;