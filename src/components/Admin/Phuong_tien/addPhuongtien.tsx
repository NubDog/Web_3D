import React, { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/PhuongTienList.css";
import BabylonScene from "../../babylon";
// --- INTERFACE CẬP NHẬT ---
export interface PhuongTien {
  phuong_tien_id: number;
  ten_phuong_tien: string;
  bien_so: string;
  so_km: number;
  trang_thai: string;
  ten_danh_muc?: string;
  ten_chinh_sach?: string;
  loai: string;
  chinh_sach_id: number;
  so_khung: string;
  ngay_tao: string;
  ngay_cap_nhat: string;
  gia_thue: number;
  img?: string; // Đường dẫn ảnh
  model?: string; // ✅ ĐÃ THÊM: Đường dẫn Models 3D
  phan_loai_id: number;
  ten_phan_loai?: string;
}

interface PhanLoai {
  phan_loai_id: number;
  hieu_xe_id: number;
  ten_phan_loai: string;
}

const API_BASE_URL = "https://r2-api.sharkeatrice.workers.dev";

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

  const [phanLoaiList, setPhanLoaiList] = useState<PhanLoai[]>([]);

  // Hàm hỗ trợ tạo URL cho API (Giữ nguyên)
  const buildCandidateUrls = (path: string) => {
    const base = API_BASE_URL.replace(/\/$/, "");
    return [
      `${base}${path.startsWith("/") ? "" : "/"}${path}`,
      `${base}/api${path.startsWith("/") ? "" : "/"}${path}`,
      path.startsWith("/") ? path : `/${path}`,
      `/api${path.startsWith("/") ? "" : "/"}${path}`,
    ];
  };

  // Hàm Fetch có Fallback (Giữ nguyên)
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

  // Tải chi tiết Phương tiện (Giữ nguyên)
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

  // Tải danh sách Danh Mục (Giữ nguyên)
  useEffect(() => {
    const loadLists = async () => {
      try {
        const r2 = await fetchWithFallback("/api/phan-loai-hieu-xe");
        setPhanLoaiList(Array.isArray(r2.data) ? r2.data : []);
      } catch {}
    };
    loadLists();
  }, []);

  // Hàm Validate Form (Giữ nguyên)
  const validateForm = (data: Partial<PhuongTien>) => {
    const errors: Record<string, string> = {};
    if (!data.ten_phuong_tien || data.ten_phuong_tien.trim().length < 3) {
      errors.ten_phuong_tien = "Tên phương tiện phải có ít nhất 3 ký tự";
    }
    if (!data.bien_so || !/^[0-9A-Z-]{5,15}$/i.test(data.bien_so)) {
      errors.bien_so = "Biển số không hợp lệ (5-15 ký tự, chỉ chữ/số/gạch)";
    }
    if (data.so_km !== undefined && data.so_km < 0) {
      errors.so_km = "Số km không được âm";
    }
    if (!data.loai) {
      errors.loai = "Vui lòng nhập loại phương tiện";
    }
    if (!data.so_khung || data.so_khung.trim().length < 5) {
      errors.so_khung = "Số khung phải có ít nhất 5 ký tự";
    }
    if (data.gia_thue !== undefined && data.gia_thue < 100000) {
      errors.gia_thue = "Giá thuê phải lớn hơn 100k";
    }
    if (!data.phan_loai_id || data.phan_loai_id <= 0) {
      errors.phan_loai_id = "Vui lòng chọn phân loại phương tiện";
    }

    return errors;
  };

  // --- HÀM SUBMIT GIỮ NGUYÊN (Sử dụng FormData) ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const gia_thue = Number(formData.get("gia_thue")) || 0;

    // Tự động tính chinh_sach_id và thêm vào FormData
    let chinh_sach_id = 0;
    if (gia_thue > 0 && gia_thue <= 1000000) {
      chinh_sach_id = 1;
    } else if (gia_thue > 1000000 && gia_thue <= 10000000) {
      chinh_sach_id = 2;
    } else if (gia_thue > 10000000) {
      chinh_sach_id = 3;
    }

    formData.set("chinh_sach_id", chinh_sach_id.toString());
    formData.set("trang_thai", "SAN_SANG");

    // Tạo object tạm thời để validate
    const payloadForValidation: Partial<PhuongTien> = {
      ten_phuong_tien: (formData.get("ten_phuong_tien") as string) || "",
      bien_so: (formData.get("bien_so") as string) || "",
      so_km: Number(formData.get("so_km")) || 0,
      loai: (formData.get("loai") as string) || "",
      so_khung: (formData.get("so_khung") as string) || "",
      gia_thue: gia_thue,
      phan_loai_id: Number(formData.get("phan_loai_id")) || 0,
    };

    const errors = validateForm(payloadForValidation);
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
          body: formData, // Gửi FormData trực tiếp
        });

        const responseData = await resp.json().catch(() => null);

        if (resp.ok) {
          navigate("/admin/phuong-tien");
          return;
        } else {
          lastErr = new Error(
            `Lỗi HTTP ${resp.status}: ${responseData?.error || resp.statusText}`
          );
        }
      } catch (err: any) {
        lastErr = err;
      }
    }
    setError(`Không thể lưu dữ liệu: ${lastErr?.message || "unknown"}`);
  };
  // --- KẾT THÚC HÀM SUBMIT ---

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
          {/* Tên Phương tiện */}
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

          {/* Biển số */}
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

          {/* Số KM */}
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

          {/* Loại */}
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

          {/* Phân loại phương tiện */}
          <div className="form-group">
            <label>Phân loại phương tiện:</label>
            <select
              name="phan_loai_id"
              defaultValue={phuongTien?.phan_loai_id ?? ""}
            >
              <option value="">-- Chọn phân loại --</option>
              {phanLoaiList.map((pl) => (
                <option key={pl.phan_loai_id} value={pl.phan_loai_id}>
                  {pl.ten_phan_loai}
                </option>
              ))}
            </select>
            {formErrors.phan_loai_id && (
              <span className="error-text">{formErrors.phan_loai_id}</span>
            )}
          </div>

          {/* Số khung */}
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

          {/* Giá Thuê */}
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

          {/* HÌNH ẢNH (UPLOAD R2) */}
          <div className="form-group">
            <label>Hình ảnh Phương tiện:</label>
            <input
              type="file"
              name="file_anh" // Tên key này phải khớp với backend!
              accept="image/*"
            />

            {/* Hiển thị ảnh hiện tại khi chỉnh sửa */}
            {isEditing && phuongTien?.img && (
              <div className="mt-2 p-2 border rounded border-gray-300">
                <p className="text-sm font-semibold mb-1">Ảnh hiện tại:</p>
                <img
                  src={`${phuongTien.img}`} // ✅ Dùng trực tiếp img vì backend đã lưu full URL
                  alt="Ảnh phương tiện"
                  className="w-32 h-32 object-cover rounded shadow"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://via.placeholder.com/128?text=Lỗi+Ảnh";
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chọn file mới để thay thế.
                </p>
              </div>
            )}
          </div>

          {/* ✅ MODELS 3D (UPLOAD R2) */}
          <div className="form-group">
            <label>Models 3D (GLB/GLTF/FBX):</label>
            <input
              type="file"
              name="models_3d"
              accept=".glb,.gltf,.fbx,.obj,.zip"
            />

            {/* Chỉ hiển thị khi đang sửa và đã có model */}
            {isEditing && phuongTien?.model && (
              <div className="mt-3 p-2 border rounded border-gray-300">
                <p className="text-sm font-semibold mb-2">Preview Models 3D:</p>

                {/* Viewer Babylon */}
                <div style={{ width: "100%", height: "350px" }}>
                  <BabylonScene modelUrl={phuongTien.model} />
                </div>

                {/* Link tải */}
                <a
                  href={phuongTien.model}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline text-xs block mt-2 truncate"
                >
                  {phuongTien.model.split("/").pop()}
                </a>

                <p className="text-xs text-gray-500 mt-1">
                  Chọn file mới để thay thế model hiện tại.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
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
