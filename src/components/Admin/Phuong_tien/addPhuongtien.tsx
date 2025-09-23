import React, { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/PhuongTienList.css";

export interface PhuongTien {
  phuong_tien_id: number;
  ten_phuong_tien: string;
  bien_so: string;
  so_km: number;
  trang_thai: string;
  ten_danh_muc?: string;
  ten_chinh_sach?: string;
  loai: string;
  danh_muc_id: number;
  chinh_sach_id: number;
  so_khung: string;
  ngay_tao: string;
  ngay_cap_nhat: string;
  gia_thue: number;
}

interface DanhMuc {
  danh_muc_id: number;
  ten_danh_muc: string;
}

const API_BASE_URL = "http://127.0.0.1:8787";

const PhuongTienModal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phuongTien, setPhuongTien] = useState<Partial<PhuongTien> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const isEditing = !!id;

  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);

  const buildCandidateUrls = (path: string) => {
    const base = API_BASE_URL.replace(/\/$/, "");
    return [
      `${base}${path.startsWith("/") ? "" : "/"}${path}`,
      `${base}/api${path.startsWith("/") ? "" : "/"}${path}`,
      path.startsWith("/") ? path : `/${path}`,
      `/api${path.startsWith("/") ? "" : "/"}${path}`,
    ];
  };

  const fetchWithFallback = async (path: string) => {
    const urls = buildCandidateUrls(path);
    let lastErr: any = null;

    for (const url of urls) {
      try {
        const resp = await fetch(url, { method: "GET" });
        const text = await resp.text();
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }
        if (resp.ok) {
          if (parsed && typeof parsed === "object") {
            if ("success" in parsed) {
              if (parsed.success) return { url, data: parsed.data };
              throw new Error(parsed.error || "API trả về success:false");
            }
            return { url, data: parsed };
          }
        }
      } catch (err: any) {
        lastErr = err;
      }
    }
    throw new Error(
      `Không lấy được dữ liệu cho ${path}. Lỗi cuối cùng: ${
        lastErr?.message || "unknown"
      }`
    );
  };

  useEffect(() => {
    const loadDetail = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchWithFallback(`/Admin/phuong-tien/${id}`);
        setPhuongTien(data as Partial<PhuongTien>);
      } catch (err: any) {
        setError(`Lỗi khi tải chi tiết phương tiện: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id, isEditing]);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const r1 = await fetchWithFallback("/Admin/danh-muc-phuong-tien");
        setDanhMucList(Array.isArray(r1.data) ? r1.data : []);
      } catch {}
    };
    loadLists();
  }, []);

  const validateForm = (data: Partial<PhuongTien>) => {
    const errors: Record<string, string> = {};
    if (!data.ten_phuong_tien || data.ten_phuong_tien.trim().length < 3) {
      errors.ten_phuong_tien = "Tên phương tiện phải có ít nhất 3 ký tự";
    }
    if (!data.bien_so || !/^[0-9A-Z-]{5,15}$/i.test(data.bien_so)) {
      errors.bien_so = "Biển số không hợp lệ (5-15 ký tự, chỉ chữ/số/gạch)";
    }
    if (data.so_km !== undefined && data.so_km <= 0) {
      errors.so_km = "Số km không được âm và phải lớn hơn 0";
    }
    if (!data.trang_thai) {
      errors.trang_thai = "Vui lòng chọn trạng thái";
    }
    if (!data.loai) {
      errors.loai = "Vui lòng nhập loại phương tiện";
    }
    if (!data.danh_muc_id || data.danh_muc_id <= 0) {
      errors.danh_muc_id = "Vui lòng chọn danh mục";
    }
    if (!data.so_khung || data.so_khung.trim().length < 5) {
      errors.so_khung = "Số khung phải có ít nhất 5 ký tự";
    }
    if (data.gia_thue !== undefined && data.gia_thue < 100000) {
      errors.gia_thue = "Giá thuê phải lớn hơn 100k";
    }
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});
    const form = e.currentTarget;
    const formData = new FormData(form);

    const gia_thue = Number(formData.get("gia_thue")) || 0;

    // ✅ Tự động tính chinh_sach_id dựa vào giá thuê
    let chinh_sach_id = 0;
    if (gia_thue > 0 && gia_thue <= 1000000) {
      chinh_sach_id = 1;
    } else if (gia_thue > 1000000 && gia_thue <= 10000000) {
      chinh_sach_id = 2;
    } else if (gia_thue > 10000000) {
      chinh_sach_id = 3;
    }

    const payload: Partial<PhuongTien> = {
      ten_phuong_tien: (formData.get("ten_phuong_tien") as string) || "",
      bien_so: (formData.get("bien_so") as string) || "",
      so_km: Number(formData.get("so_km")) || 0,
      trang_thai: (formData.get("trang_thai") as string) || "",
      loai: (formData.get("loai") as string) || "",
      danh_muc_id: Number(formData.get("danh_muc_id")) || 0,
      so_khung: (formData.get("so_khung") as string) || "",
      gia_thue,
      chinh_sach_id, // ✅ gán tự động
    };

    const errors = validateForm(payload);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const path = isEditing ? `/Admin/phuong-tien/${id}` : `/Admin/phuong-tien`;
    const candidates = buildCandidateUrls(path);

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const resp = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (resp.ok) {
          navigate("/admin/phuong-tien");
          return;
        } else {
          lastErr = new Error(`HTTP ${resp.status}`);
        }
      } catch (err: any) {
        lastErr = err;
      }
    }
    setError(`Không thể lưu dữ liệu: ${lastErr?.message || "unknown"}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="phuong-tien-modal-container">
      <div className="form-container">
        <h2 className="text-xl font-bold mb-4" style={{ color: "#333" }}>
          {isEditing ? `Sửa Phương tiện` : "Thêm Phương tiện"}
        </h2>

        {error && <div className="error-global">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Phương tiện:</label>
            <input
              type="text"
              name="ten_phuong_tien"
              defaultValue={phuongTien?.ten_phuong_tien || ""}
            />
            {formErrors.ten_phuong_tien && (
              <span className="error-text">{formErrors.ten_phuong_tien}</span>
            )}
          </div>

          <div className="form-group">
            <label>Biển số:</label>
            <input
              type="text"
              name="bien_so"
              defaultValue={phuongTien?.bien_so || ""}
            />
            {formErrors.bien_so && (
              <span className="error-text">{formErrors.bien_so}</span>
            )}
          </div>

          <div className="form-group">
            <label>Số KM:</label>
            <input
              type="number"
              name="so_km"
              defaultValue={phuongTien?.so_km ?? 0}
            />
            {formErrors.so_km && (
              <span className="error-text">{formErrors.so_km}</span>
            )}
          </div>

          <div className="form-group">
            <label>Trạng thái:</label>
            <select
              name="trang_thai"
              defaultValue={phuongTien?.trang_thai || "SAN_SANG"}
            >
              <option value="SAN_SANG">Sẵn sàng</option>
              <option value="DA_DAT">Đã đặt</option>
              <option value="BAO_TRI">Bảo trì</option>
              <option value="CHO_DUYET">Chờ duyệt</option>
            </select>
            {formErrors.trang_thai && (
              <span className="error-text">{formErrors.trang_thai}</span>
            )}
          </div>

          <div className="form-group">
            <label>Loại:</label>
            <input
              type="text"
              name="loai"
              defaultValue={phuongTien?.loai || ""}
            />
            {formErrors.loai && (
              <span className="error-text">{formErrors.loai}</span>
            )}
          </div>

          <div className="form-group">
            <label>Danh mục:</label>
            <select
              name="danh_muc_id"
              defaultValue={phuongTien?.danh_muc_id ?? ""}
            >
              <option value="">-- Chọn danh mục --</option>
              {danhMucList.map((dm) => (
                <option key={dm.danh_muc_id} value={dm.danh_muc_id}>
                  {dm.ten_danh_muc}
                </option>
              ))}
            </select>
            {formErrors.danh_muc_id && (
              <span className="error-text">{formErrors.danh_muc_id}</span>
            )}
          </div>

          <div className="form-group">
            <label>Số khung:</label>
            <input
              type="text"
              name="so_khung"
              defaultValue={phuongTien?.so_khung || ""}
            />
            {formErrors.so_khung && (
              <span className="error-text">{formErrors.so_khung}</span>
            )}
          </div>

          <div className="form-group">
            <label>Giá Thuê:</label>
            <input
              type="number"
              name="gia_thue"
              defaultValue={phuongTien?.gia_thue ?? 0}
            />
            {formErrors.gia_thue && (
              <span className="error-text">{formErrors.gia_thue}</span>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)}>
              Hủy
            </button>
            <button type="submit">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhuongTienModal;
