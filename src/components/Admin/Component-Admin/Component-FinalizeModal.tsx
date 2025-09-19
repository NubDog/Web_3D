import React, { useState, useMemo } from 'react';
import'../Component-Admin/css/ReturnVehicleModal.css';

interface FinalizeData {
  phi_hu_hong: number;
  phi_tre: number;
  chi_phi_khac: number;
  ghi_chu_quyet_toan: string;
}

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FinalizeData) => void;
  isSubmitting: boolean;
  order: { tien_coc_yeu_cau: number, tong_tien: number } | null;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, order }) => {
  const [phiHuHong, setPhiHuHong] = useState(0);
  const [phiTre, setPhiTre] = useState(0);
  const [chiPhiKhac, setChiPhiKhac] = useState(0);
  const [ghiChu, setGhiChu] = useState('');

  const totalFines = useMemo(() => phiHuHong + phiTre + chiPhiKhac, [phiHuHong, phiTre, chiPhiKhac]);
  const finalAmount = useMemo(() => {
    if (!order) return { amount: 0, type: '...' };
    const balance = order.tien_coc_yeu_cau - totalFines;
    return balance >= 0
      ? { amount: balance, type: 'Hoàn lại khách' }
      : { amount: Math.abs(balance), type: 'Khách trả thêm' };
  }, [totalFines, order]);
  
  if (!isOpen || !order) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      phi_hu_hong: phiHuHong,
      phi_tre: phiTre,
      chi_phi_khac: chiPhiKhac,
      ghi_chu_quyet_toan: ghiChu,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Quyết Toán Đơn Hàng</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div className="summary-box">
              <p><strong>Tiền cọc đã giữ:</strong> {formatCurrency(order.tien_coc_yeu_cau)}</p>
            </div>
            <div className="form-group">
              <label htmlFor="phi_hu_hong">Phí hư hỏng</label>
              <input id="phi_hu_hong" type="number" value={phiHuHong} onChange={(e) => setPhiHuHong(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label htmlFor="phi_tre">Phí trả trễ</label>
              <input id="phi_tre" type="number" value={phiTre} onChange={(e) => setPhiTre(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label htmlFor="chi_phi_khac">Chi phí khác</label>
              <input id="chi_phi_khac" type="number" value={chiPhiKhac} onChange={(e) => setChiPhiKhac(Number(e.target.value))} />
            </div>
             <div className="form-group">
              <label htmlFor="ghi_chu">Ghi chú quyết toán</label>
              <textarea id="ghi_chu" rows={3} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}></textarea>
            </div>
            <div className="summary-box final-summary">
              <p><strong>Tổng chi phí phát sinh:</strong> {formatCurrency(totalFines)}</p>
              <p><strong>{finalAmount.type}:</strong> <span className={finalAmount.type === 'Khách trả thêm' ? 'amount-due' : 'amount-refund'}>{formatCurrency(finalAmount.amount)}</span></p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Quyết toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinalizeModal;