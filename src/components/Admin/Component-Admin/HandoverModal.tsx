import React, { useState,useEffect } from 'react';
import './css/handoverModal.css';

interface HandoverData {
  so_km: string;
  muc_xang: string;
  ghi_chu_hu_hong: string;
  anh_minh_chung: FileList | null;
}

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HandoverData) => void;
  isSubmitting: boolean;
  initialKm: number;
}

const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, initialKm }) => {
  const [soKm, setSoKm] = useState<string>("");
  const [muc_xang, setMucXang] = useState('Đầy bình');
  const [ghi_chu, setGhiChu] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (isOpen && initialKm !== undefined) {
      setSoKm(initialKm.toString());
    }
  }, [isOpen, initialKm]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      so_km: soKm,
      muc_xang: muc_xang,
      ghi_chu_hu_hong: ghi_chu,
      anh_minh_chung: files,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Bàn Giao Xe</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="so_km">Số KM lúc giao</label> 
              <input 
                id="so_km" 
                type="number" 
                value={soKm} 
                onChange={(e) => setSoKm(e.target.value)} 
                required 
                placeholder="Nhập số KM thực tế"
              />
            </div>
            <div className="form-group">
              <label htmlFor="muc_xang">Mức xăng</label>
              <select id="muc_xang" value={muc_xang} onChange={(e) => setMucXang(e.target.value)}>
                <option value="Đầy bình">Đầy bình</option>
                <option value="3/4">3/4 bình</option>
                <option value="1/2">1/2 bình</option>
                <option value="1/4">1/4 bình</option>
                <option value="Rỗng">Rỗng</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ghi_chu">Ghi chú hư hỏng có sẵn</label>
              <textarea id="ghi_chu" rows={3} value={ghi_chu} onChange={(e) => setGhiChu(e.target.value)}></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="anh_minh_chung">Ảnh minh chứng</label>
              <input id="anh_minh_chung" type="file" multiple onChange={(e) => setFiles(e.target.files)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Bàn Giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HandoverModal;