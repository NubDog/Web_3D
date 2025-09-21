
import React, { useState } from 'react';
import './css/ReturnVehicleModal.css'

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
        alert('Vui lòng nhập lý do hủy đơn.');
        return;
    }
    onSubmit(reason);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Xác Nhận Hủy Đơn Hàng</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="reason">Vui lòng nhập lý do hủy</label>
              <textarea
                id="reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Khách hàng báo bận, muốn đổi xe khác..."
                required
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Bỏ qua</button>
            <button type="submit" className="button-reject" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Hủy Đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelOrderModal;