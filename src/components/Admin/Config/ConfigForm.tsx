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
  const [activeTab, setActiveTab] = useState<
    "contact" | "payment" | "violations" | "location" | "maintenance"
  >("contact");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    // Contact
    hotline: config.CONTACT.HOTLINE,
    supportEmail: config.CONTACT.SUPPORT_EMAIL,

    // Payment
    bankCode: config.PAYMENT?.BANK_CODE || "MB",
    bankName: config.PAYMENT?.BANK_NAME || "MB Bank",
    accountNumber: config.PAYMENT?.ACCOUNT_NUMBER || "",
    accountName: config.PAYMENT?.ACCOUNT_NAME || "",

    // Violations
    minDebt: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_DEBT || 1000000,
    minCount: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_COUNT || 2,

    // Location
    shopAddress: config.Locations.DIACHISHOP,
    cityShop: config.Locations.CHINHANHTP,

    // Email
    emailFromName: config.EMAIL?.FROM_NAME || "Hệ thống cho thuê",
    emailFromAddress: config.EMAIL?.FROM_EMAIL || "onboarding@resend.dev",

    // Maintenance
    hanBaoTriPhuongTien: 6,
  });

  useEffect(() => {
    setFormData({
      hotline: config.CONTACT.HOTLINE,
      supportEmail: config.CONTACT.SUPPORT_EMAIL,
      bankCode: config.PAYMENT?.BANK_CODE || "MB",
      bankName: config.PAYMENT?.BANK_NAME || "MB Bank",
      accountNumber: config.PAYMENT?.ACCOUNT_NUMBER || "",
      accountName: config.PAYMENT?.ACCOUNT_NAME || "",
      minDebt: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_DEBT || 1000000,
      minCount: config.VIOLATIONS?.BLOCK_THRESHOLDS?.MIN_COUNT || 2,
      shopAddress: config.Locations.DIACHISHOP,
      cityShop: config.Locations.CHINHANHTP,
      emailFromName: config.EMAIL?.FROM_NAME || "Hệ thống cho thuê",
      emailFromAddress: config.EMAIL?.FROM_EMAIL || "onboarding@resend.dev",
      hanBaoTriPhuongTien: config.MAINTENANCE?.HAN_BAO_TRI_PHUONG_TIEN || 6,
    });
  }, [config]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9\\s]{10}$/; // Chấp nhận số, dấu +, -, khoảng trắng, độ dài 8-15

    if (!formData.hotline.trim()) {
      newErrors.hotline = "Vui lòng nhập Hotline.";
    } else if (!phoneRegex.test(formData.hotline)) {
      newErrors.hotline = "Số điện thoại không hợp lệ.";
    }

    if (!formData.supportEmail.trim()) {
      newErrors.supportEmail = "Vui lòng nhập Email hỗ trợ.";
    } else if (!emailRegex.test(formData.supportEmail)) {
      newErrors.supportEmail = "Email không đúng định dạng.";
    }

    if (!formData.emailFromAddress.trim()) {
      newErrors.emailFromAddress = "Vui lòng nhập Email gửi đi.";
    } else if (!emailRegex.test(formData.emailFromAddress)) {
      newErrors.emailFromAddress = "Email gửi đi không đúng định dạng.";
    }

    if (!formData.bankCode) newErrors.bankCode = "Vui lòng chọn ngân hàng.";
    if (!formData.bankName.trim())
      newErrors.bankName = "Vui lòng nhập tên ngân hàng.";

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Vui lòng nhập số tài khoản.";
    } else if (!/^[0-9a-zA-Z\-\s]+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = "Số tài khoản chứa ký tự không hợp lệ.";
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = "Vui lòng nhập tên chủ tài khoản.";
    } else if (
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
        formData.accountName,
      )
    ) {
      newErrors.accountName = "Tên chủ tài khoản ngân hàng thường KHÔNG DẤU.";
    }

    if (!formData.shopAddress.trim())
      newErrors.shopAddress = "Vui lòng nhập địa chỉ.";
    if (!formData.cityShop.trim())
      newErrors.cityShop = "Vui lòng nhập thành phố.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof typeof formData,
  ) => {
    setFormData({ ...formData, [field]: e.target.value });

    if (errors[field]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin báo đỏ!");
      return;
    }

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
          QR_BASE_URL: `https://img.vietqr.io/image/${formData.bankCode}-${formData.accountNumber}-compact2.png`,
        },
        VIOLATIONS: {
          BLOCK_THRESHOLDS: {
            MIN_DEBT: Number(formData.minDebt),
            MIN_COUNT: Number(formData.minCount),
          },
          EMAIL: {
            SUBJECT_BLOCKED:
              config.VIOLATIONS?.EMAIL?.SUBJECT_BLOCKED ||
              "⛔ TÀI KHOẢN BỊ KHÓA DO VI PHẠM",
            REASON_DEBT:
              config.VIOLATIONS?.EMAIL?.REASON_DEBT ||
              "Tổng số tiền vi phạm vượt quá ngưỡng",
            REASON_COUNT:
              config.VIOLATIONS?.EMAIL?.REASON_COUNT ||
              "Số lần vi phạm vượt quá ngưỡng",
            AFTER_PAYMENT_NOTE:
              config.VIOLATIONS?.EMAIL?.AFTER_PAYMENT_NOTE ||
              "Vui lòng thanh toán để mở khóa",
            SUBJECT_VIOLATION:
              config.VIOLATIONS?.EMAIL?.SUBJECT_VIOLATION ||
              "⚠️ Thông báo vi phạm",
            SUBJECT_PAYMENT_CONFIRMED:
              config.VIOLATIONS?.EMAIL?.SUBJECT_PAYMENT_CONFIRMED ||
              "✅ Xác nhận thanh toán",
            SUBJECT_VIOLATION_CANCELLED:
              config.VIOLATIONS?.EMAIL?.SUBJECT_VIOLATION_CANCELLED ||
              "🔄 Hủy vi phạm",
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
        MAINTENANCE: {
          HAN_BAO_TRI_PHUONG_TIEN: Number(formData.hanBaoTriPhuongTien),
        },
      });

      toast.success("✅ Lưu cấu hình thành công!");
    } catch (err: any) {
      toast.error(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const previewQRUrl =
    formData.bankCode && formData.accountNumber
      ? `https://img.vietqr.io/image/${formData.bankCode}-${formData.accountNumber}-compact2.png?amount=100000&addInfo=TEST&accountName=${encodeURIComponent(formData.accountName)}`
      : "";

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

  const renderError = (field: string) => {
    return errors[field] ? (
      <span className="error-message">{errors[field]}</span>
    ) : null;
  };

  return (
    <div className="config-form-container">
      <header className="config-header">
        <div className="header-left">
          <FaBuilding className="header-icon" />
          <div>
            <h1>Cấu Hình Hệ Thống</h1>
            {lastUpdated && (
              <small
                style={{
                  color: "#6c757d",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaClock /> Cập nhật:{" "}
                {new Date(lastUpdated).toLocaleString("vi-VN")}
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
        <button
          className={`tab-button ${activeTab === "location" ? "active" : ""}`}
          onClick={() => setActiveTab("location")}
        >
          <FaMapMarkerAlt /> Địa chỉ
        </button>
        <button
          className={`tab-button ${activeTab === "maintenance" ? "active" : ""}`}
          onClick={() => setActiveTab("maintenance")}
        >
          <FaExclamationTriangle /> Bảo trì
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
                  <FaPhone className="label-icon" /> Hotline *
                </label>
                <input
                  type="text"
                  placeholder="Nhập số hotline"
                  value={formData.hotline}
                  onChange={(e) => handleInputChange(e, "hotline")}
                  className={errors.hotline ? "input-error" : ""}
                />
                {renderError("hotline")}
                <small>Số điện thoại hỗ trợ khách hàng</small>
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="label-icon" /> Email hỗ trợ
                </label>
                <input
                  type="email"
                  placeholder="Nhập email hỗ trợ"
                  value={formData.supportEmail}
                  onChange={(e) => handleInputChange(e, "supportEmail")}
                  className={errors.supportEmail ? "input-error" : ""}
                />
                {renderError("supportEmail")}
                <small>Email nhận phản hồi từ khách hàng</small>
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="label-icon" /> Tên người gửi email
                </label>
                <input
                  type="text"
                  placeholder="VD: Hệ thống cho thuê"
                  value={formData.emailFromName}
                  onChange={(e) => handleInputChange(e, "emailFromName")}
                />
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="label-icon" /> Địa chỉ email gửi
                </label>
                <input
                  type="email"
                  placeholder="VD: no-reply@example.com"
                  value={formData.emailFromAddress}
                  onChange={(e) => handleInputChange(e, "emailFromAddress")}
                  className={errors.emailFromAddress ? "input-error" : ""}
                />
                {renderError("emailFromAddress")}
                <small>Email hệ thống dùng để gửi thông báo</small>
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
                    <FaUniversity className="label-icon" /> Mã ngân hàng *
                  </label>
                  <select
                    value={formData.bankCode}
                    onChange={(e) => handleInputChange(e, "bankCode")}
                    className={errors.bankCode ? "input-error" : ""}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
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
                  {renderError("bankCode")}
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" /> Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MB Bank"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange(e, "bankName")}
                    className={errors.bankName ? "input-error" : ""}
                  />
                  {renderError("bankName")}
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" /> Số tài khoản *
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập số tài khoản"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange(e, "accountNumber")}
                    className={errors.accountNumber ? "input-error" : ""}
                  />
                  {renderError("accountNumber")}
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="label-icon" /> Chủ tài khoản *
                  </label>
                  <input
                    type="text"
                    placeholder="Tên chủ tài khoản (KHÔNG DẤU)"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange(e, "accountName")}
                    className={errors.accountName ? "input-error" : ""}
                  />
                  {renderError("accountName")}
                  <small>Tên chủ tài khoản (không dấu, viết hoa)</small>
                </div>
              </div>
            </section>

            {previewQRUrl && (
              <section className="preview-section">
                <div className="preview-header">
                  <h3>
                    <FaQrcode /> TEST QR Code
                  </h3>
                  <span className="preview-badge">TEST</span>
                </div>
                <div
                  className="preview-content"
                  style={{ textAlign: "center" }}
                >
                  <p style={{ marginBottom: "10px", color: "black" }}>
                    <strong>URL QR:</strong>
                  </p>
                  <code
                    style={{
                      background: "#f3f4f6",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      display: "block",
                      marginBottom: "20px",
                      wordBreak: "break-all",
                      color: "#374151",
                    }}
                  >
                    {previewQRUrl}
                  </code>

                  <div
                    style={{
                      display: "inline-block",
                      padding: "20px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    <img
                      src={previewQRUrl}
                      alt="QR Code Preview"
                      style={{
                        width: "240px",
                        height: "240px",
                        border: "2px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/240?text=QR+Error";
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#ffffff",
                      marginTop: "15px",
                    }}
                  >
                    {formData.bankCode && formData.accountNumber
                      ? "QR hợp lệ - Số tiền test: 100,000 VNĐ"
                      : "Vui lòng nhập đủ thông tin"}
                  </p>
                </div>
              </section>
            )}
          </>
        )}

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
                  <FaMapMarkerAlt className="label-icon" /> Địa chỉ cửa hàng
                </label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ"
                  value={formData.shopAddress}
                  onChange={(e) => handleInputChange(e, "shopAddress")}
                  className={errors.shopAddress ? "input-error" : ""}
                />
                {renderError("shopAddress")}
              </div>

              <div className="form-group">
                <label>
                  <FaMapMarkerAlt className="label-icon" /> Thành phố
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên thành phố"
                  value={formData.cityShop}
                  onChange={(e) => handleInputChange(e, "cityShop")}
                  className={errors.cityShop ? "input-error" : ""}
                />
                {renderError("cityShop")}
              </div>
            </div>
          </section>
        )}
        {activeTab === "maintenance" && (
          <section className="config-section">
            <div className="section-header">
              <h2>
                <FaExclamationTriangle /> Bảo trì phương tiện
              </h2>
              <p>Thiết lập chu kỳ bảo trì theo tháng</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Hạn bảo trì phương tiện (tháng)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={formData.hanBaoTriPhuongTien}
                  onChange={(e) => handleInputChange(e, "hanBaoTriPhuongTien")}
                />
                <small>Ví dụ: 6 = bảo trì mỗi 6 tháng</small>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ConfigForm;
