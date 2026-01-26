import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaBuilding,
  FaSave,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaUniversity,
  FaExclamationTriangle,
  FaQrcode,
} from "react-icons/fa";
import "./ConfigForm.css";
import { useConfig } from "../../../contexts/ConfigContext";

const ConfigForm: React.FC = () => {
  const { config, updateConfig, isLoading, lastUpdated } = useConfig();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"contact" | "payment" | "violations" | "location">("contact");

  const [formData, setFormData] = useState({
    // Contact
    hotline: config.CONTACT.HOTLINE,
    supportEmail: config.CONTACT.SUPPORT_EMAIL,
    
    // Payment
    bankCode: config.PAYMENT?.BANK_CODE || 'MB',
    bankName: config.PAYMENT?.BANK_NAME || 'MB Bank',
    accountNumber: config.PAYMENT?.ACCOUNT_NUMBER || '',
    accountName: config.PAYMENT?.ACCOUNT_NAME || '',
    
    // Violations
    minDebt: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_DEBT || 1000000,
    minCount: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_COUNT || 2,
    
    // Location
    shopAddress: config.Locations.DIACHISHOP,
    cityShop: config.Locations.CHINHANHTP,
    
    // Email
    emailFromName: config.EMAIL?.FROM_NAME || 'Hệ thống cho thuê',
    emailFromAddress: config.EMAIL?.FROM_EMAIL || 'onboarding@resend.dev',
  });

  useEffect(() => {
    setFormData({
      hotline: config.CONTACT.HOTLINE,
      supportEmail: config.CONTACT.SUPPORT_EMAIL,
      bankCode: config.PAYMENT?.BANK_CODE || 'MB',
      bankName: config.PAYMENT?.BANK_NAME || 'MB Bank',
      accountNumber: config.PAYMENT?.ACCOUNT_NUMBER || '',
      accountName: config.PAYMENT?.ACCOUNT_NAME || '',
      minDebt: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_DEBT || 1000000,
      minCount: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_COUNT || 2,
      shopAddress: config.Locations.DIACHISHOP,
      cityShop: config.Locations.CHINHANHTP,
      emailFromName: config.EMAIL?.FROM_NAME || 'Hệ thống cho thuê',
      emailFromAddress: config.EMAIL?.FROM_EMAIL || 'onboarding@resend.dev',
    });
  }, [config]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof typeof formData
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.hotline.trim()) {
      toast.error("Vui lòng nhập hotline");
      return;
    }

    if (!formData.bankCode.trim()) {
      toast.error("Vui lòng chọn mã ngân hàng");
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig({
        CONTACT: {
          HOTLINE: formData.hotline,
          SUPPORT_EMAIL: formData.supportEmail,
        },
        PAYMENT: {
          BANK_CODE: formData.bankCode,
          BANK_NAME: formData.bankName,
          ACCOUNT_NUMBER: formData.accountNumber,
          ACCOUNT_NAME: formData.accountName,
          QR_BASE_URL: `https://img.vietqr.io/image/${formData.bankCode}-${formData.accountNumber}-compact2.png`
        },
        VIOLATIONS: {
            BLOCK_THRESHOLDS: {
            MIN_DEBT: Number(formData.minDebt),
            MIN_COUNT: Number(formData.minCount),
            },
            EMAIL: {
            SUBJECT_BLOCKED: config.VIOLATIONS?.EMAIL?.SUBJECT_BLOCKED || '⛔ TÀI KHOẢN BỊ KHÓA DO VI PHẠM',
            REASON_DEBT: config.VIOLATIONS?.EMAIL?.REASON_DEBT || 'Tổng số tiền vi phạm vượt quá ngưỡng',
            REASON_COUNT: config.VIOLATIONS?.EMAIL?.REASON_COUNT || 'Số lần vi phạm vượt quá ngưỡng',
            AFTER_PAYMENT_NOTE: config.VIOLATIONS?.EMAIL?.AFTER_PAYMENT_NOTE || 'Vui lòng thanh toán để mở khóa',
            SUBJECT_VIOLATION: config.VIOLATIONS?.EMAIL?.SUBJECT_VIOLATION || '⚠️ Thông báo vi phạm',
            SUBJECT_PAYMENT_CONFIRMED: config.VIOLATIONS?.EMAIL?.SUBJECT_PAYMENT_CONFIRMED || '✅ Xác nhận thanh toán',
            SUBJECT_VIOLATION_CANCELLED: config.VIOLATIONS?.EMAIL?.SUBJECT_VIOLATION_CANCELLED || '🔄 Hủy vi phạm',
            },
        },
        Locations: {
          DIACHISHOP: formData.shopAddress,
          CHINHANHTP: formData.cityShop,
        },
        EMAIL: {
          FROM_NAME: formData.emailFromName,
          FROM_EMAIL: formData.emailFromAddress,
        },
      });

      toast.success("✅ Lưu cấu hình thành công!");
    } catch (err: any) {
      toast.error(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ TẠO QR PREVIEW
  const previewQRUrl = formData.bankCode && formData.accountNumber
    ? `https://img.vietqr.io/image/${formData.bankCode}-${formData.accountNumber}-compact2.png?amount=100000&addInfo=TEST&accountName=${encodeURIComponent(formData.accountName)}`
    : '';

  if (isLoading) {
    return (
      <div className="config-form-container">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <div className="spinner"></div>
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-form-container">
      <header className="config-header">
        <div className="header-left">
          <FaBuilding className="header-icon" />
          <div>
            <h1>Cấu Hình Hệ Thống</h1>
            {lastUpdated && (
              <small style={{ color: "#6c757d", display: "flex", alignItems: "center", gap: "5px" }}>
                <FaClock /> Cập nhật: {new Date(lastUpdated).toLocaleString("vi-VN")}
              </small>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="button-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            <FaSave />
            {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </header>

      <div className="config-tabs">
        <button
          className={`tab-button ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          <FaPhone /> Liên hệ
        </button>
        <button
          className={`tab-button ${activeTab === "payment" ? "active" : ""}`}
          onClick={() => setActiveTab("payment")}
        >
          <FaUniversity /> Thanh toán
        </button>
        {/* <button
          className={`tab-button ${activeTab === "violations" ? "active" : ""}`}
          onClick={() => setActiveTab("violations")}
        >
          <FaExclamationTriangle /> Vi phạm
        </button> */}
        <button
          className={`tab-button ${activeTab === "location" ? "active" : ""}`}
          onClick={() => setActiveTab("location")}
        >
          <FaMapMarkerAlt /> Địa chỉ
        </button>
      </div>

      {/* Content */}
      <div className="config-content">
        {activeTab === "contact" && (
          <section className="config-section">
            <div className="section-header">
              <h2>
                <FaPhone /> Thông tin liên hệ
              </h2>
              <p>Thông tin liên hệ với khách hàng</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FaPhone className="label-icon" />
                  Hotline *
                </label>
                <input
                  type="text"
                  placeholder="Nhập số hotline (VD: 0123 456 789)"
                  value={formData.hotline}
                  onChange={(e) => handleInputChange(e, "hotline")}
                />
                <small>Số điện thoại hỗ trợ khách hàng</small>
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="label-icon" />
                  Email hỗ trợ
                </label>
                <input
                  type="email"
                  placeholder="Nhập email hỗ trợ"
                  value={formData.supportEmail}
                  onChange={(e) => handleInputChange(e, "supportEmail")}
                />
                <small>Email nhận phản hồi từ khách hàng</small>
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="label-icon" />
                  Tên người gửi email
                </label>
                <input
                  type="text"
                  placeholder="VD: Hệ thống cho thuê"
                  value={formData.emailFromName}
                  onChange={(e) => handleInputChange(e, "emailFromName")}
                />
                <small>Tên hiển thị khi gửi email</small>
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="label-icon" />
                  Địa chỉ email gửi
                </label>
                <input
                  type="email"
                  placeholder="VD: no-reply@example.com"
                  value={formData.emailFromAddress}
                  onChange={(e) => handleInputChange(e, "emailFromAddress")}
                />
                <small>Email dùng để gửi</small>
              </div>
            </div>
          </section>
        )}

        {activeTab === "payment" && (
          <>
            <section className="config-section">
              <div className="section-header">
                <h2>
                  <FaUniversity /> Thông tin thanh toán
                </h2>
                <p>Cấu hình tài khoản ngân hàng nhận thanh toán</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" />
                    Mã ngân hàng *
                  </label>
                  <select
                    value={formData.bankCode}
                    onChange={(e) => handleInputChange(e, "bankCode")}
                    style={{ 
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    <option value="MB">MB Bank (Quân đội)</option>
                    <option value="VCB">Vietcombank</option>
                    <option value="TCB">Techcombank</option>
                    <option value="VIB">VIB</option>
                    <option value="ACB">ACB</option>
                    <option value="ICB">Vietinbank</option>
                    <option value="TPB">TPBank</option>
                    <option value="VPB">VPBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="AGRIBANK">Agribank</option>
                    <option value="STB">Sacombank</option>
                    <option value="SCB">SCB</option>
                  </select>
                  <small>Mã ngân hàng (dùng cho VietQR)</small>
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" />
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MB Bank"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange(e, "bankName")}
                  />
                  <small>Tên hiển thị đầy đủ</small>
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" />
                    Số tài khoản *
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập số tài khoản"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange(e, "accountNumber")}
                  />
                  <small>Số tài khoản ngân hàng</small>
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" />
                    Chủ tài khoản *
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên chủ tài khoản (KHÔNG DẤU)"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange(e, "accountName")}
                  />
                  <small>Tên chủ tài khoản (không dấu, viết hoa)</small>
                </div>
              </div>
            </section>

            {previewQRUrl && (
              <section className="preview-section">
                <div className="preview-header">
                  <h3><FaQrcode /> TEST QR Code</h3>
                  <span className="preview-badge">TEST</span>
                </div>
                <div className="preview-content" style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '10px', color: 'black'}}><strong>URL QR:</strong></p>
                  <code style={{ 
                    background: '#f3f4f6', 
                    padding: '8px 12px', 
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'block',
                    marginBottom: '20px',
                    wordBreak: 'break-all',
                    color: '#374151'
                  }}>
                    {previewQRUrl}
                  </code>
                  
                  <div style={{ 
                    display: 'inline-block',
                    padding: '20px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    <img 
                      src={previewQRUrl} 
                      alt="QR Code Preview" 
                      style={{ 
                        width: '240px', 
                        height: '240px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/240?text=QR+Error';
                      }}
                    />
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#ffffff', marginTop: '15px' }}>
                    {formData.bankCode && formData.accountNumber 
                      ? 'QR hợp lệ - Số tiền test: 100,000 VNĐ' 
                      : 'Vui lòng nhập đủ thông tin'}
                  </p>
                </div>
              </section>
            )}
          </>
        )}
{/* 
        {activeTab === "violations" && (
          <section className="config-section">
            <div className="section-header">
              <h2>
                <FaExclamationTriangle /> Ngưỡng vi phạm
              </h2>
              <p>Cấu hình ngưỡng khóa tài khoản</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FaExclamationTriangle className="label-icon" />
                  Tổng nợ tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="VD: 1000000"
                  value={formData.minDebt}
                  onChange={(e) => handleInputChange(e, "minDebt")}
                />
                <small>Nợ vi phạm vượt ngưỡng này sẽ bị khóa</small>
              </div>

              <div className="form-group">
                <label>
                  <FaExclamationTriangle className="label-icon" />
                  Số lần vi phạm tối thiểu
                </label>
                <input
                  type="number"
                  placeholder="VD: 2"
                  value={formData.minCount}
                  onChange={(e) => handleInputChange(e, "minCount")}
                />
                <small>Số lần vi phạm trở lên sẽ bị khóa</small>
              </div>
            </div>

            <div className="info-note" style={{ marginTop: '20px' }}>
              <p>
                💡 <strong>Lưu ý:</strong> Tài khoản sẽ bị khóa khi ĐỦ 1 trong 2 điều kiện:
              </p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>Tổng nợ vi phạm ≥ {Number(formData.minDebt).toLocaleString('vi-VN')} VNĐ</li>
                <li>Số lần vi phạm ≥ {formData.minCount} lần</li>
              </ul>
            </div>
          </section>
        )} */}

        {activeTab === "location" && (
          <section className="config-section">
            <div className="section-header">
              <h2>
                <FaMapMarkerAlt /> Địa chỉ cửa hàng
              </h2>
              <p>Thông tin địa chỉ chi nhánh</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FaMapMarkerAlt className="label-icon" />
                  Địa chỉ cửa hàng
                </label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ"
                  value={formData.shopAddress}
                  onChange={(e) => handleInputChange(e, "shopAddress")}
                />
                <small>Địa chỉ chi nhánh chính</small>
              </div>

              <div className="form-group">
                <label>
                  <FaMapMarkerAlt className="label-icon" />
                  Thành phố
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên thành phố"
                  value={formData.cityShop}
                  onChange={(e) => handleInputChange(e, "cityShop")}
                />
                <small>Thành phố hoạt động</small>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ConfigForm;
