import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./BaoTriChiTiet.css";

// Giao diện dữ liệu bảo trì chi tiết (giữ nguyên)
interface BaoTriChiTiet {
  bao_tri_id: number;
  phuong_tien_id: number;
  don_thue_id_lien_quan: number | null;
  ngay_lich: string | null;
  mo_ta: string;
  chi_phi: number;
  trang_thai_baotri: string; // Vẫn là trạng thái từ DB (ví dụ: CHO_DUYET)
  nhan_vien_tao: number;
  ngay_tao: string;
  ngay_cap_nhat: string;
  // Người dùng
  ten_dang_nhap: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  // Phương tiện
  img: string;
  ten_phuong_tien: string;
  loai: string;
  bien_so: string;
  so_km: number;
  gia_thue: number;
  so_khung: string;
  danh_muc_id: number;
  chinh_sach_id: number;
  // Các trường khác cho payload PUT
  trang_thai?: string;
  trang_thai_phuong_tien?: string;
}

const STATUS_MAP: { [key: string]: string } = {
  "Chờ duyệt": "CHO_DUYET",
  "Đã duyệt": "DA_DUYET",
  // "Đang lên lịch": "DANG_LEN_LICH",
  // "Đang bảo trì": "DANG_BAO_TRI",
  // "Chờ kiểm tra/Bàn giao": "CHO_KIEM_TRA_BAN_GIAO",
  "Đã hoàn thành": "DA_HOAN_THANH",
  "Đã hủy": "DA_HUY",
};

const STATUS_STEPS_DISPLAY = [
  "Chờ duyệt",
  "Đã duyệt",
  // "Đang lên lịch",
  // "Đang bảo trì",
  // "Chờ kiểm tra/Bàn giao",
  "Đã hoàn thành",
  // 'Đã hủy' được xử lý riêng
];

const BaoTriChiTiet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [baotrichitiet, setBaotrichitiet] = useState<BaoTriChiTiet | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const API_URL = "https://r2-api.sharkeatrice.workers.dev";

  // Hàm tiện ích: chuyển trạng thái DB sang trạng thái hiển thị
  const getDisplayStatus = (dbStatus: string): string => {
    const entry = Object.entries(STATUS_MAP).find(
      ([, dbVal]) => dbVal === dbStatus.toUpperCase()
    );
    return entry ? entry[0] : dbStatus; // Trả về nhãn hoặc trạng thái DB nếu không tìm thấy
  };

  // Hàm tiện ích: chuyển trạng thái hiển thị sang DB
  const getDbStatus = (displayStatus: string): string => {
    return STATUS_MAP[displayStatus] || displayStatus;
  };

  // Hàm lấy dữ liệu chi tiết (giữ nguyên logic fetch)
  const fetchBaoTriChiTiet = useCallback(() => {
    if (!id) return;

    setLoading(true);
    fetch(`${API_URL}/Admin/baotri/chitiet/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBaotrichitiet(json.data);
        } else {
          console.error("Lỗi API:", json.error);
          toast.error(`Lỗi tải dữ liệu: ${json.error}`);
        }
      })
      .catch((err) => {
        console.error("Lỗi fetch:", err);
        toast.error("Lỗi kết nối máy chủ khi tải dữ liệu.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchBaoTriChiTiet();
  }, [fetchBaoTriChiTiet]);

  // Hàm cập nhật trạng thái
  const handleUpdateStatus = async (newDisplayStatus: string) => {
    if (!baotrichitiet) return;

    // 👈 CHUYỂN TRẠNG THÁI HIỂN THỊ THÀNH TRẠNG THÁI DB ĐỂ GỬI LÊN SERVER
    const newDbStatus = getDbStatus(newDisplayStatus);

    try {
      const res = await fetch(
        `${API_URL}/api/baotri/${baotrichitiet.bao_tri_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...baotrichitiet,
            trang_thai: newDbStatus, // Gửi trạng thái DB
          }),
        }
      );

      const json = await res.json();

      if (json.success) {
        toast.success(`Cập nhật trạng thái thành công: ${newDisplayStatus}`);
        fetchBaoTriChiTiet();
      } else {
        console.error("Lỗi cập nhật:", json.error);
        toast.error(`Cập nhật trạng thái thất bại: ${json.error}`);
      }
    } catch (error) {
      console.error("Lỗi fetch cập nhật:", error);
      toast.error("Lỗi kết nối máy chủ khi cập nhật trạng thái.");
    }
  };

  // 1. Render Thanh tiến trình (Status Timeline)
  const renderStatusTimeline = () => {
    if (!baotrichitiet) return null;

    const currentDbStatus = baotrichitiet.trang_thai_baotri.toUpperCase();

    // Xử lý riêng cho trạng thái Hủy
    if (currentDbStatus === STATUS_MAP["Đã hủy"]) {
      return (
        <div className="timeline-container timeline-cancelled">
          <p className="timeline-message">❌ Đã hủy</p>
          <p className="timeline-sub-message">
            Yêu cầu bảo trì này đã bị hủy bỏ.
          </p>
        </div>
      );
    }

    const currentIndex = STATUS_STEPS_DISPLAY.findIndex(
      (step) => STATUS_MAP[step] === currentDbStatus
    );

    return (
      <div className="timeline-container">
        <h3 className="sub-header">📊 Tiến trình Bảo trì</h3>
        <div className="timeline-track">
          {STATUS_STEPS_DISPLAY.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isActive = index === currentIndex;

            let stepClasses = "timeline-step";
            if (isCompleted) stepClasses += " completed";
            if (isActive) stepClasses += " active";

            return (
              <div key={step} className={stepClasses}>
                <div className="timeline-circle">
                  {isCompleted && !isActive ? "✓" : index + 1}
                </div>
                <p className="timeline-label">{step}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. Render Nút hành động
  const renderActionButtons = () => {
    if (!baotrichitiet) return null;

    // Lấy trạng thái từ DB và chuẩn hóa thành UPPERCASE
    const status = baotrichitiet.trang_thai_baotri.toUpperCase();

    switch (status) {
      case STATUS_MAP["Chờ duyệt"]:
        return (
          <>
            <button
              onClick={() => handleUpdateStatus("Đã duyệt")}
              className="button button-approve"
            >
              ✅ Duyệt Bảo trì
            </button>
            <button
              onClick={() => handleUpdateStatus("Đã hủy")}
              className="button button-reject"
            >
              ❌ Hủy bỏ
            </button>
          </>
        );
      // case STATUS_MAP[""]:
      //   return (
      //     <button
      //       onClick={() => handleUpdateStatus("Đang lên lịch")}
      //       className="button button-primary"
      //     >
      //       🗓️ Lên lịch Bảo trì
      //     </button>
      //   );
      // case STATUS_MAP["Đang lên lịch"]:
      //   return (
      //     <button
      //       onClick={() => handleUpdateStatus("Đang bảo trì")}
      //       className="button button-warning"
      //     >
      //       🔧 Bắt đầu Bảo trì
      //     </button>
      //   );
      // case STATUS_MAP["Đang bảo trì"]:
      //   return (
      //     <button
      //       onClick={() => handleUpdateStatus("Chờ kiểm tra/Bàn giao")}
      //       className="button button-primary"
      //     >
      //       🔍 Hoàn thành Bảo trì (Chờ KT)
      //     </button>
      //   );
      case STATUS_MAP["Đã duyệt"]:
        return (
          <button
            onClick={() => handleUpdateStatus("Đã hoàn thành")}
            className="button button-complete"
          >
            ✅ Xác nhận hoàn thành
          </button>
        );
      case STATUS_MAP["Đã hoàn thành"]:
      case STATUS_MAP["Đã hủy"]:

      default:
        return null;
    }
  };

  if (loading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  if (!baotrichitiet) {
    return <div>Không tìm thấy chi tiết bảo trì.</div>;
  }

  // Hàm phụ để lấy class badge cho trạng thái
  const getStatusBadgeClass = (status: string) => {
    const s = status.toUpperCase();
    if (s === STATUS_MAP["Chờ duyệt"]) return "badge-pending";
    if (s === STATUS_MAP["Đã duyệt"]) return "badge-approved";
    // if (s === STATUS_MAP["Đang lên lịch"]) return "badge-scheduled";
    // if (s === STATUS_MAP["Đang bảo trì"]) return "badge-in-progress";
    if (s === STATUS_MAP["Đã hoàn thành"]) return "badge-completed";
    if (s === STATUS_MAP["Đã hủy"]) return "badge-cancelled";
    return "badge-default";
  };

  // Lấy trạng thái hiển thị
  const displayStatus = getDisplayStatus(baotrichitiet.trang_thai_baotri);

  return (
    <div className="baotri-container">
      {/* HEADER & STATUS */}
      <h1 className="header">Chi tiết Bảo trì #{baotrichitiet.bao_tri_id}</h1>
      <div className="status-header">
        <span
          className={`status-badge ${getStatusBadgeClass(
            baotrichitiet.trang_thai_baotri
          )}`}
        >
          {displayStatus}
        </span>
      </div>

      {/* 1. THANH TIẾN TRÌNH */}
      {renderStatusTimeline()}
      <hr className="divider" />

      {/* 2. THÔNG TIN CHUNG & PHƯƠNG TIỆN (GRID) */}
      <div className="grid">
        {/* Cột 1: Thông tin Bảo trì & Người tạo */}
        <div className="card">
          <h3 className="sub-header">📝 Thông tin Bảo trì</h3>
          <p>
            <b>Mô tả:</b> {baotrichitiet.mo_ta}
          </p>
          <p>
            <b>Chi phí dự kiến:</b>{" "}
            <span className="cost-text">
              {(baotrichitiet.chi_phi || 0).toLocaleString("vi-VN")} VND
            </span>
          </p>
          <p>
            <b>Ngày lên lịch:</b>{" "}
            {baotrichitiet.ngay_lich
              ? new Date(baotrichitiet.ngay_lich).toLocaleDateString()
              : "Chưa lên lịch"}
          </p>
          <p>
            <b>Đơn thuê liên quan:</b>{" "}
            {baotrichitiet.don_thue_id_lien_quan || "Không có"}
          </p>
          <p>
            <b>Ngày tạo yêu cầu:</b>{" "}
            {new Date(baotrichitiet.ngay_tao).toLocaleDateString()}
          </p>
          <hr className="sub-divider" />
          <h3 className="sub-header">👤 Người tạo</h3>
          <p>
            <b>Họ tên:</b> {baotrichitiet.ho_ten}
          </p>
          <p>
            <b>Email:</b> {baotrichitiet.email}
          </p>
          <p>
            <b>SĐT:</b> {baotrichitiet.so_dien_thoai}
          </p>
        </div>

        {/* Cột 2: Thông tin Phương tiện & Hình ảnh */}
        <div className="card">
          <h3 className="sub-header">🏍️ Thông tin Phương tiện</h3>
          <p>
            <b>Tên:</b> {baotrichitiet.ten_phuong_tien}
          </p>
          <p>
            <b>Biển số:</b> {baotrichitiet.bien_so}
          </p>
          <p>
            <b>Loại phương tiện:</b> {baotrichitiet.loai}
          </p>
          <p>
            <b>Số KM hiện tại:</b> {baotrichitiet.so_km.toLocaleString("vi-VN")}{" "}
            km
          </p>
          <p>
            <b>Số khung:</b> {baotrichitiet.so_khung}
          </p>
          <p>
            <b>Trạng thái phương tiện:</b>{" "}
            {baotrichitiet.trang_thai_phuong_tien || "Không rõ"}
          </p>
        </div>
      </div>

      {/* 3. KHU VỰC HÀNH ĐỘNG (DƯỚI CÙNG) */}
      <hr className="divider" />
      {baotrichitiet.trang_thai_baotri === STATUS_MAP["Đã hoàn thành"] ||
      baotrichitiet.trang_thai_baotri === STATUS_MAP["Đã hủy"] ? (
        <></>
      ) : (
        <>
          <div className="action-section">
            <h3 className="sub-header">🛠️ Chuyển đổi Trạng thái</h3>
            <div className="button-group">{renderActionButtons()}</div>
          </div>
        </>
      )}
      <div className="back-button-container">
        <button className="button-back">
          <Link to="/admin/bao_tri/all">
            <span className="icon">←</span>Quay lại Danh sách Bảo trì
          </Link>
        </button>
      </div>
    </div>
  );
};

export default BaoTriChiTiet;
