import React, { useState, useMemo, useEffect } from 'react';
import '../Component-Admin/css/ReturnVehicleModal.css';

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
  // State cho các đơn vị nhập liệu
  const [daysLate, setDaysLate] = useState(0);
  const [damagePercent, setDamagePercent] = useState(0);
  
  // State cho các chi phí cuối cùng
  const [phiHuHong, setPhiHuHong] = useState(0);
  const [phiTre, setPhiTre] = useState(0);
  const [chiPhiKhac, setChiPhiKhac] = useState(0);
  const [ghiChu, setGhiChu] = useState('');

  // Tự động tính tiền khi số ngày hoặc % thay đổi
  useEffect(() => {
    setPhiTre(daysLate * 100000);
  }, [daysLate]);

  useEffect(() => {
    setPhiHuHong(damagePercent * 200000);
  }, [damagePercent]);

  const totalFines = useMemo(() => phiHuHong + phiTre + chiPhiKhac, [phiHuHong, phiTre, chiPhiKhac]);
  
  const finalAmount = useMemo(() => {
    if (!order) return { amount: 0, type: '...' };
    const balance = order.tien_coc_yeu_cau - totalFines;
    return balance >= 0
      ? { amount: balance, type: 'Hoàn lại khách' }
      : { amount: Math.abs(balance), type: 'Khách trả thêm' };
  }, [totalFines, order]);
  
  if (!isOpen || !order) return null;

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
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Quyết Toán Đơn Hàng</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          
          <div className="modal-body">
            <div className="summary-box" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', height: '50px',marginBottom: '20px' , }}>
              <p style={{textAlign: 'center', marginTop: '17px'}}><strong>Tiền cọc đã giữ:</strong> {formatCurrency(order.tien_coc_yeu_cau)}</p>
            </div>

            {/* PHÍ TRẢ TRỄ */}
            <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Số ngày trễ</label>
                <input 
                  type="number" 
                  min="0"
                  value={daysLate} 
                  onChange={(e) => setDaysLate(Number(e.target.value))} 
                  placeholder="0"
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Thành tiền phí trễ (100k/ngày)</label>
                <input 
                  type="text" 
                  readOnly 
                  value={formatCurrency(phiTre)} 
                  style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
                />
              </div>
            </div>

            {/* PHÍ HƯ HẠI */}
            <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>% Hư hại</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={damagePercent} 
                  onChange={(e) => setDamagePercent(Number(e.target.value))} 
                  placeholder="0"
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Thành tiền hư hại (200k/1%)</label>
                <input 
                  type="text" 
                  readOnly 
                  value={formatCurrency(phiHuHong)} 
                  style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
                />
              </div>
            </div>

            {/* CHI PHÍ KHÁC */}
            <div className="form-group">
              <label htmlFor="chi_phi_khac">Chi phí phát sinh khác (nếu có)</label>
              <input 
                id="chi_phi_khac" 
                type="number" 
                value={chiPhiKhac} 
                onChange={(e) => setChiPhiKhac(Number(e.target.value))} 
              />
            </div>

            <div className="form-group">
              <label htmlFor="ghi_chu">Ghi chú quyết toán</label>
              <textarea 
                id="ghi_chu" 
                rows={2} 
                value={ghiChu} 
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Lý do hư hỏng, địa điểm trả trễ..."
              ></textarea>
            </div>

            <div className="summary-box final-summary" style={{ marginTop: '20px', borderTop: '2px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Tổng chi phí khấu trừ:</span>
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{formatCurrency(totalFines)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                <strong>{finalAmount.type}:</strong>
                <strong className={finalAmount.type === 'Khách trả thêm' ? 'amount-due' : 'amount-refund'}>
                  {formatCurrency(finalAmount.amount)}
                </strong>
              </div>
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