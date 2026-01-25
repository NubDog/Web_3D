import React, { useState, useEffect } from 'react';
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

const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialKm,
}) => {
  const [soKm, setSoKm] = useState<string>('');
  const [muc_xang, setMucXang] = useState('Đầy');
  const [ghi_chu, setGhiChu] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && initialKm !== undefined) {
      setSoKm(initialKm.toString());
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
    onSubmit({
      so_km: soKm,
      muc_xang,
      ghi_chu_hu_hong: ghi_chu,
      anh_minh_chung: files,
    });
  };

  return (
    <div className="ho-modal-overlay">
      <div className="ho-modal">
        <form onSubmit={handleSubmit}>
          <div className="ho-modal__header">
            <div>
              <h2>Bàn giao phương tiện cho khách</h2>
              <p className="ho-modal__subtitle">
                Ghi nhận hiện trạng ban đầu để đối chiếu khi khách trả phương tiện.
              </p>
            </div>
            <button type="button" onClick={onClose} className="ho-modal__close">
              &times;
            </button>
          </div>

          <div className="ho-modal__body">
            <div className="ho-modal__col ho-modal__col--form">
              <div className="ho-section-header">
                <span className="ho-section-dot" />
                <span>Thông số bàn giao</span>
              </div>

              <div className="ho-form-group">
                <label htmlFor="so_km">
                  Số ODO lúc giao
                  <span className="ho-inline-note">
                    {' '}
                    (ODO thực tế tại thời điểm giao)
                  </span>
                </label>
                <input
                  id="so_km"
                  type="number"
                  value={soKm}
                  onChange={(e) => setSoKm(e.target.value)}
                  required
                  placeholder="Nhập số KM hiển thị trên đồng hồ"
                />
              </div>

              <div className="ho-form-group">
                <label htmlFor="muc_xang">Mức nhiên liệu / Pin</label>
                <select
                  id="muc_xang"
                  value={muc_xang}
                  onChange={(e) => setMucXang(e.target.value)}
                >
                  <option value="Đầy">Đầy (100%)</option>
                  <option value="3/4">3/4 (75%)</option>
                  <option value="1/2">1/2  (50%)</option>
                  <option value="1/4">1/4  (25%)</option>
                  <option value="Rỗng">Rỗng / Gần hết</option>
                </select>
              </div>

              <div className="ho-form-group">
                <label htmlFor="ghi_chu">Ghi chú hư hỏng có sẵn</label>
                <textarea
                  id="ghi_chu"
                  rows={4}
                  value={ghi_chu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Mô tả các vết trầy, móp, nứt, phụ kiện thiếu hiện có..."
                />
              </div>
            </div>

            <div className="ho-modal__col ho-modal__col--media">
              <div className="ho-section-header">
                <span className="ho-section-dot ho-section-dot--accent" />
                <span>Ảnh / media bàn giao</span>
              </div>

              <div className="ho-form-group">
                <label htmlFor="anh_minh_chung">Ảnh minh chứng khi giao</label>
                <div className="ho-upload-area">
                  <input
                    id="anh_minh_chung"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                  <p className="ho-upload-hint">
                    Chụp tổng thể phương tiện, 4 góc, đồng hồ KM, mức nhiên liệu và các
                    vết trầy/hư hỏng có sẵn. Có thể chọn nhiều ảnh / video.
                  </p>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="ho-preview-grid">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="ho-preview-item">
                      <img src={url} alt={`ban-giao-${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ho-modal__footer">
            <button
              type="button"
              className="ho-btn ho-btn--ghost"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="ho-btn ho-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận bàn giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HandoverModal;
