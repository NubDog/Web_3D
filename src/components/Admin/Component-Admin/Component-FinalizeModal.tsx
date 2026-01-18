import React, { useState, useMemo, useEffect } from 'react';
import '../Component-Admin/css/ReturnVehicleModal.css';
import type { OrderDetail } from '../Admin_Order/OrderDetail';

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
  order: OrderDetail | null;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting, 
  order 
}) => {
  const [daysLate, setDaysLate] = useState(0);
  const [hoursLate, setHoursLate] = useState(0);
  const [damagePercent, setDamagePercent] = useState(0);
  
  const [phiHuHong, setPhiHuHong] = useState(0);
  const [phiTre, setPhiTre] = useState(0);
  const [chiPhiKhac, setChiPhiKhac] = useState(0);
  const [ghiChu, setGhiChu] = useState('');

  const lateInfo = useMemo(() => {
    if (!order?.ngay_ket_thuc || !order?.ngay_tra_thuc_te) {
      return { days: 0, hours: 0, description: 'Chưa có dữ liệu' };
    }

    const duKien = new Date(order.ngay_ket_thuc);
    const thucTe = new Date(order.ngay_tra_thuc_te);
    
    const diffMs = thucTe.getTime() - duKien.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, description: 'Trả đúng hạn' };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return { 
      days, 
      hours, 
      description: days > 0 
        ? `Trễ ${days} ngày ${hours > 0 ? `${hours} giờ` : ''}`
        : `Trễ ${hours} giờ`
    };
  }, [order]);

  const actualRentalInfo = useMemo(() => {
    if (!order?.ngay_giao_thuc_te || !order?.ngay_tra_thuc_te) {
      return { days: 0, hours: 0, description: 'N/A' };
    }

    const giao = new Date(order.ngay_giao_thuc_te);
    const tra = new Date(order.ngay_tra_thuc_te);
    
    const diffMs = tra.getTime() - giao.getTime();
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return { 
      days, 
      hours, 
      description: `${days} ngày ${hours} giờ`
    };
  }, [order]);

  useEffect(() => {
    if (isOpen && order) {
      setDaysLate(lateInfo.days);
      setHoursLate(lateInfo.hours);
    }
  }, [isOpen, order, lateInfo]);

  // Tính phí trễ: 100k/ngày + 5k/giờ lẻ
  useEffect(() => {
    const phiNgay = daysLate * 400000;
    const phiGio = hoursLate * 5000;
    setPhiTre(phiNgay + phiGio);
  }, [daysLate, hoursLate]);

  // Tính phí hư hỏng: 200k/1%
  useEffect(() => {
    setPhiHuHong(damagePercent * 200000);
  }, [damagePercent]);

  const financialBreakdown = useMemo(() => {
    if (!order) return {
      soNgayThue: 0,
      giaThue: 0,
      tamTinh: 0,
      khuyenMai: 0,
      tienThue: 0,
      tyLeCoc: 0,
      tienCoc: 0,
      phiPhatSinh: 0,
      tongQuyetToan: 0
    };

    // Số ngày thuê (từ hợp đồng)
    const soNgayThue = Math.ceil(
      (new Date(order.ngay_ket_thuc).getTime() - new Date(order.ngay_bat_dau).getTime()) 
      / (1000 * 60 * 60 * 24)
    );

    // Giá thuê
    const giaThue = order.gia_thue;

    // Tạm tính
    const tamTinh = giaThue * soNgayThue;

    // Khuyến mãi
    const khuyenMai = Math.round(tamTinh * (order.ty_le_giam / 100));

    // Tiền thuê (sau giảm)
    const tienThue = tamTinh - khuyenMai;

    // Tiền cọc (tỷ lệ %)
    const tyLeCoc = order.tien_coc_yeu_cau; // VD: 40%
    const tienCoc = Math.round(tienThue * (tyLeCoc / 100));

    // Phí phát sinh
    const phiPhatSinh = phiTre + phiHuHong + chiPhiKhac;

    // TỔNG QUYẾT TOÁN = (Tiền thuê - Tiền cọc) + Phí phát sinh
    const tongQuyetToan = (tienThue - tienCoc) + phiPhatSinh;

    return {
      soNgayThue,
      giaThue,
      tamTinh,
      khuyenMai,
      tienThue,
      tyLeCoc,
      tienCoc,
      phiPhatSinh,
      tongQuyetToan
    };
  }, [order, phiTre, phiHuHong, chiPhiKhac]);

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
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Quyết Toán Đơn Hàng #{order.don_thue_id}</h2>
            <button type="button" onClick={onClose} className="close-button">&times;</button>
          </div>
          
          <div className="modal-body">
            <div className="time-comparison" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>⏱️ Thời gian thuê</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ opacity: 0.9, marginBottom: '4px' }}>📅 Hợp đồng</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {formatDateTime(order.ngay_bat_dau)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>→</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {formatDateTime(order.ngay_ket_thuc)}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ opacity: 0.9, marginBottom: '4px' }}>✅ Thực tế</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {order.ngay_giao_thuc_te ? formatDateTime(order.ngay_giao_thuc_te) : 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>→</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {order.ngay_tra_thuc_te ? formatDateTime(order.ngay_tra_thuc_te) : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ 
                marginTop: '12px', 
                padding: '10px', 
                background: lateInfo.days > 0 ? 'rgba(255, 77, 79, 0.3)' : 'rgba(82, 196, 26, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <strong>{lateInfo.description}</strong>
              </div>
            </div>

            <div className="summary-box" style={{ 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff', 
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, textAlign: 'center' }}>
                <strong>Tiền cọc đã giữ ({financialBreakdown.tyLeCoc}%):</strong> {formatCurrency(financialBreakdown.tienCoc)}
              </p>
            </div>

            <div className="form-section" style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#ff4d4f' }}>
                ⏰ Phí trả trễ
              </h4>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Số ngày</label>
                  <input 
                    type="number" 
                    min="0"
                    value={daysLate} 
                    onChange={(e) => setDaysLate(Number(e.target.value))} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Số giờ lẻ</label>
                  <input 
                    type="number" 
                    min="0"
                    max="23"
                    value={hoursLate} 
                    onChange={(e) => setHoursLate(Number(e.target.value))} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Thành tiền (400k/ngày + 5k/giờ)</label>
                <input 
                  type="text" 
                  readOnly 
                  value={formatCurrency(phiTre)} 
                  style={{ backgroundColor: '#fff1f0', fontWeight: 'bold', color: '#cf1322' }}
                />
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#fa8c16' }}>
                🔧 Phí hư hại
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>% Hư hại</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={damagePercent} 
                    onChange={(e) => setDamagePercent(Number(e.target.value))} 
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Thành tiền (200k/1%)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={formatCurrency(phiHuHong)} 
                    style={{ backgroundColor: '#fff7e6', fontWeight: 'bold', color: '#d46b08' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="chi_phi_khac">💰 Chi phí phát sinh khác</label>
              <input 
                id="chi_phi_khac" 
                type="number" 
                value={chiPhiKhac} 
                onChange={(e) => setChiPhiKhac(Number(e.target.value))} 
                placeholder="Phí vệ sinh, đổ xăng..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="ghi_chu">📝 Ghi chú quyết toán</label>
              <textarea 
                id="ghi_chu" 
                rows={2} 
                value={ghiChu} 
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Lý do hư hỏng, địa điểm trả, tình trạng xe..."
              ></textarea>
            </div>

             <div style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>💰 Thông tin Tài chính</h3>
              
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'black'}}>
                  <span>Giá thuê:</span>
                  <strong>{formatCurrency(financialBreakdown.giaThue)} x {financialBreakdown.soNgayThue} ngày</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold',color: 'black' }}>
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(financialBreakdown.tamTinh)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52c41a' }}>
                  <span>Khuyến mãi (Chính sách thường -{order.ty_le_giam}%):</span>
                  <span>-{formatCurrency(financialBreakdown.khuyenMai)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f', marginTop: '5px' }}>
                  <span>Phí phát sinh (Hư hỏng/Trễ):</span>
                  <span>+{formatCurrency(financialBreakdown.phiPhatSinh)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'black'}}>
                <span>Tiền cọc đã giữ ({order.tien_coc_yeu_cau}%):</span>
                <span>{formatCurrency((order.tong_tien - (order.tong_tien * (order.ty_le_giam/100))) * (order.tien_coc_yeu_cau/100))}</span>
              </div>

              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '2px solid #d9d9d9',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#1890ff'
              }}>
                <span>Tổng quyết toán: (đã trừ {formatCurrency(financialBreakdown.tienCoc)} tiền cọc)</span>
                <span style={{ fontSize: '20px' }}>{formatCurrency(financialBreakdown.tongQuyetToan)}</span>
              </div>
              

              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                background: '#fff7e6',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#ad6800'
              }}>
                Chi tiết: Trễ: {formatCurrency(phiTre)} | Hư hỏng: {formatCurrency(phiHuHong)} | Khác: {formatCurrency(chiPhiKhac)}
              </div>
            </div>
          </div>

          

          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : '✅ Xác nhận Quyết toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinalizeModal;
