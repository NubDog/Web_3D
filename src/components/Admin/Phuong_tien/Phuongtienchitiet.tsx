import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BabylonScene from "../../babylon";

const Phuongtienchitietadmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://r2-api.sharkeatrice.workers.dev/Admin/phuong-tien/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setItem(res.data);
        setLoading(false);
      })
      .catch((err) => console.error("Lỗi:", err));
  }, [id]);

  // Hàm bổ trợ để lấy class CSS cho từng trạng thái
  const getStatusClass = (status: string) => {
    switch (status) {
      case "DA_DAT":
        return "status-badge-black";
      case "BAO_TRI":
        return "status-badge-red";
      case "SAN_SANG":
        return "status-badge-green";
      default:
        return "status-badge-default";
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-sans text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  if (!item)
    return (
      <div className="p-10 text-center font-sans">
        Không tìm thấy phương tiện
      </div>
    );

  return (
    <div className="pt-admin-detail-root min-h-screen bg-[#f1f4f9] p-4 md:p-8 font-sans text-[#333]">
      <style>{`
        .pt-admin-detail-root { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .pt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .pt-header h2 { font-size: 28px; font-weight: 500; color: #334155; }
        
        .pt-card { background: white; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; }
        .pt-card-header { padding: 12px 20px; border-bottom: 1px solid #f1f5f9; background: #fafafa; font-weight: 600; font-size: 14px; color: #475569; }
        
        .pt-info-table { width: 100%; border-collapse: collapse; }
        .pt-info-row { border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; padding: 12px 20px; }
        .pt-info-row:last-child { border-bottom: none; }
        .pt-label { width: 35%; color: #64748b; font-size: 14px; font-weight: 500; }
        .pt-value { width: 65%; text-align: right; color: #1e293b; font-size: 14px; }
        
        /* Style cho Status Badges */
        .status-badge-base {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-badge-black {
          border: 1.5px solid #000;
          color: #000;
          background: transparent;
        }
        .status-badge-red {
          border: 1px solid #ef4444;
          color: #ef4444;
          background: #fef2f2;
        }
        .status-badge-green {
          border: 1px solid #22c55e;
          color: #16a34a;
          background: #f0fdf4;
        }
        .status-badge-default {
          border: 1px solid #cbd5e1;
          color: #64748b;
        }

        .pt-btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; }
        .pt-btn-gray { background: #fff; color: #64748b; border: 1px solid #e2e8f0; }
        .pt-btn-green { background: #4caf50; color: white; margin-left: 10px; }
        
        .pt-img-box { height: 220px; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 10px; }
        .pt-img-box img { max-height: 100%; max-width: 100%; object-fit: contain; }
        .pt-3d-box { background: #f8fafc; height: 300px; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Header điều hướng */}
      <div className="pt-header max-w-7xl mx-auto">
        <h2>Chi tiết phương tiện</h2>
        <div className="flex">
          <button onClick={() => navigate(-1)} className="pt-btn pt-btn-gray">
            Quay lại
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* CỘT TRÁI */}
        <div className="md:col-span-4 space-y-6">
          <div className="pt-card">
            <div className="pt-card-header">Ảnh đại diện</div>
            <div className="pt-img-box">
              <img src={item.img} alt={item.ten_phuong_tien} />
            </div>
          </div>

          <div className="pt-card">
            <div className="pt-card-header">Mô phỏng 3D</div>
            <div className="pt-3d-box">
              <BabylonScene modelUrl={item.model} />
            </div>
          </div>

          <div className="pt-card">
            <div className="pt-card-header">Thông tin hệ thống</div>
            <div className="pt-info-table">
              <div className="pt-info-row">
                <span className="pt-label">ID</span>
                <span className="pt-value">#{item.phuong_tien_id}</span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Trạng thái</span>
                <span className="pt-value">
                  <span
                    className={`status-badge-base ${getStatusClass(
                      item.trang_thai
                    )}`}
                  >
                    {item.trang_thai === "SAN_SANG"
                      ? "Sẵn sàng"
                      : item.trang_thai === "DA_DAT"
                      ? "Đã đặt"
                      : item.trang_thai === "BAO_TRI"
                      ? "Bảo trì"
                      : item.trang_thai}
                  </span>
                </span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Ngày tạo</span>
                <span className="pt-value">
                  {new Date(item.ngay_tao).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="md:col-span-8">
          <div className="pt-card mb-6">
            <div className="pt-card-header">Thông tin chi tiết phương tiện</div>
            <div className="pt-info-table">
              <div className="pt-info-row">
                <span className="pt-label">Tên phương tiện</span>
                <span className="pt-value font-bold text-[15px]">
                  {item.ten_phuong_tien}
                </span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Biển số xe</span>
                <span className="pt-value font-mono font-semibold">
                  {item.bien_so}
                </span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Số Km đã đi</span>
                <span className="pt-value">
                  {item.so_km?.toLocaleString()} km
                </span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Dòng xe (Model)</span>
                <span className="pt-value">{item.loai}</span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Phân loại</span>
                <span className="pt-value">{item.ten_phan_loai}</span>
              </div>
              <div className="pt-info-row" style={{ background: "#f8fafc" }}>
                <span className="pt-label font-bold text-slate-700">
                  Giá thuê (ngày)
                </span>
                <span className="pt-value font-bold text-blue-600 text-[16px]">
                  {item.gia_thue?.toLocaleString()} VND
                </span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Số khung</span>
                <span className="pt-value font-mono">{item.so_khung}</span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Tiền cọc</span>
                <span className="pt-value">{item.tien_coc_mac_dinh}%</span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Chính sách</span>
                <span className="pt-value">{item.ten_chinh_sach}</span>
              </div>
              <div className="pt-info-row">
                <span className="pt-label">Cập nhật cuối</span>
                <span className="pt-value text-slate-500">
                  {new Date(item.ngay_cap_nhat).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phuongtienchitietadmin;
