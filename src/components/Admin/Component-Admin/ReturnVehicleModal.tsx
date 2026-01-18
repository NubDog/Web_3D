import React, { useState, useEffect } from 'react';
import './css/ReturnVehicleModal.css'; 

interface ReturnData {
  so_km_tra: string;
  muc_xang_tra: string;
  ghi_chu_hu_hong_moi: string;
  anh_minh_chung: FileList | null;
}

interface ReturnVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReturnData) => void; 
  isSubmitting: boolean;
  initialKm: number;
}

const ReturnVehicleModal: React.FC<ReturnVehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialKm,
}) => {
  const [so_km, setSoKm] = useState<string>('');
  const [muc_xang, setMucXang] = useState('Đầy');
  const [ghi_chu, setGhiChu] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSoKm(initialKm ? initialKm.toString() : '');
      setMucXang('Đầy');
      setGhiChu('');
      setFiles(null);
      setPreviewUrls([]);
    }
  }, [isOpen, initialKm]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    setFiles(list);

    if (!list) {
      setPreviewUrls([]);
      return;
    }

    const urls = Array.from(list).map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (Number(so_km) < initialKm) {
      alert(
        `Số KM trả (${so_km}) không được nhỏ hơn số KM lúc giao (${initialKm}). Vui lòng kiểm tra lại.`,
      );
      return;
    }

    onSubmit({
      so_km_tra: so_km,
      muc_xang_tra: muc_xang,
      ghi_chu_hu_hong_moi: ghi_chu,
      anh_minh_chung: files,
    });
  };

  return (
    <div className="rv-modal-overlay">
      <div className="rv-modal">
        <form onSubmit={handleSubmit}>
          <div className="rv-modal__header">
            <div>
              <h2>Tiếp nhận xe trả</h2>
              <p className="rv-modal__subtitle">
                Ghi nhận hiện trạng xe trước khi quyết toán hợp đồng.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rv-modal__close"
            >
              &times;
            </button>
          </div>

          <div className="rv-modal__body">
            <div className="rv-modal__col rv-modal__col--form">
              <div className="rv-section-header">
                <span className="rv-section-dot" />
                <span>Thông số trả phương tiện</span>
              </div>

              <div className="rv-form-group">
                <label htmlFor="so_km">
                  Số ODO lúc trả
                  <span className="rv-inline-note">
                    (ODO thực tế tại thời điểm giao:{' '}
                    {new Intl.NumberFormat('vi-VN').format(initialKm)})
                  </span>
                </label>
                <input
                  id="so_km"
                  type="number"
                  value={so_km}
                  onChange={(e) => setSoKm(e.target.value)}
                  required
                  placeholder="Nhập số ODO hiện tại..."
                />
              </div>

              <div className="rv-form-group">
                <label htmlFor="muc_xang">Mức nhiên liệu / Pin</label>
                <select
                  id="muc_xang"
                  value={muc_xang}
                  onChange={(e) => setMucXang(e.target.value)}
                >
                  <option value="Đầy">Đầy (100%)</option>
                  <option value="3/4">3/4  (75%)</option>
                  <option value="1/2">1/2  (50%)</option>
                  <option value="1/4">1/4  (25%)</option>
                  <option value="Gần hết">Gần hết (Reserve)</option>
                </select>
              </div>

              <div className="rv-form-group">
                <label htmlFor="ghi_chu">
                  Ghi chú hư hỏng / Vấn đề phát sinh
                </label>
                <textarea
                  id="ghi_chu"
                  rows={4}
                  value={ghi_chu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Mô tả các vết trầy xước mới, hỏng hóc, phụ kiện thiếu..."
                />
              </div>
            </div>

            <div className="rv-modal__col rv-modal__col--media">
              <div className="rv-section-header">
                <span className="rv-section-dot rv-section-dot--accent" />
                <span>Ảnh / Media minh chứng</span>
              </div>

              <div className="rv-form-group">
                <label htmlFor="anh_moi">Tải lên ảnh hiện trạng</label>
                <div className="rv-upload-area">
                  <input
                    id="anh_moi"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                  <p className="rv-upload-hint">
                    Kéo thả hoặc chọn tối đa 10 file (ảnh / video). Ưu tiên chụp
                    các vị trí có trầy xước, móp, phụ kiện thiếu.
                  </p>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="rv-preview-grid">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="rv-preview-item">
                      <img src={url} alt={`minh-chung-${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rv-modal__footer">
            <button
              type="button"
              className="rv-btn rv-btn--ghost"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rv-btn rv-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận tiếp nhận xe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnVehicleModal;