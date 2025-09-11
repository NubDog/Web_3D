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
  gia_co_ban: number;
  tien_coc_mac_dinh: number;
  loai: string;
  danh_muc_id: number;
  chinh_sach_id: number;
  so_khung: string;
  ngay_tao: string;
  ngay_cap_nhat: string;
}

interface DanhMuc {
  danh_muc_id: number;
  ten_danh_muc: string;
}

interface ChinhSachGia {
  chinh_sach_id: number;
  ten_chinh_sach: string;
  gia_co_ban?: number;
  tien_coc_mac_dinh?: number;
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
  const isEditing = !!id;

  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [chinhSachList, setChinhSachList] = useState<ChinhSachGia[]>([]);

  // Helper: tạo các URL thử (có/không /api; absolute/relative)
  const buildCandidateUrls = (path: string) => {
    const base = API_BASE_URL.replace(/\/$/, "");
    return [
      `${base}${path.startsWith("/") ? "" : "/"}${path}`, // http://127.0.0.1:8787/...
      `${base}/api${path.startsWith("/") ? "" : "/"}${path}`, // http://127.0.0.1:8787/api/...
      path.startsWith("/") ? path : `/${path}`, // relative /...
      `/api${path.startsWith("/") ? "" : "/"}${path}`, // relative /api/...
    ];
  };

  // Fetch robust: thử nhiều URL, log chi tiết, trả về dữ liệu JSON hoặc ném lỗi mô tả
  const fetchWithFallback = async (path: string) => {
    const urls = buildCandidateUrls(path);
    let lastErr: any = null;

    for (const url of urls) {
      try {
        console.log("[fetchWithFallback] Trying URL:", url);
        const resp = await fetch(url, { method: "GET" });
        const status = resp.status;
        const text = await resp.text(); // đọc text trước để tránh crash
        // Log response brief
        console.log(
          `[fetchWithFallback] ${url} → status ${status}; body (start):`,
          text.slice(0, 300)
        );

        // Try parse JSON
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = null;
        }

        if (resp.ok) {
          if (parsed !== null) {
            // Nếu dạng { success: true, data: ... }
            if (Object.prototype.hasOwnProperty.call(parsed, "success")) {
              if (parsed.success) {
                return { url, data: parsed.data };
              } else {
                // server trả success:false
                throw new Error(
                  `API trả về success:false (${url}) - ${JSON.stringify(
                    parsed
                  )}`
                );
              }
            }
            // Nếu không có success, giả sử đó chính là object data
            return { url, data: parsed };
          } else {
            // 200 nhưng không JSON (HTML, text...) -> báo rõ
            throw new Error(
              `Response OK nhưng không phải JSON. body start: ${text.slice(
                0,
                300
              )}`
            );
          }
        } else {
          // not ok -> nhớ lỗi rồi thử url khác
          lastErr = new Error(
            `HTTP ${status} từ ${url}. bodyStart: ${text.slice(0, 200)}`
          );
          console.warn(
            "[fetchWithFallback] not ok -> continue to next candidate",
            lastErr
          );
        }
      } catch (err: any) {
        // network error (CORS, connection refused...) hoặc JSON parse error / thrown
        lastErr = err;
        console.warn("[fetchWithFallback] error for URL", url, err);
        // Nếu là lỗi network (TypeError: Failed to fetch) -> tiếp tục thử candidate khác
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
        // thử fetch detail
        const { url, data } = await fetchWithFallback(
          `/Admin/phuong-tien/${id}`
        );
        console.log("[loadDetail] success url:", url, "data:", data);
        // nếu backend trả trực tiếp object (không bọc `data`) thì data = object
        const payload = data && typeof data === "object" ? data : data;
        setPhuongTien(payload as Partial<PhuongTien>);
      } catch (err: any) {
        console.error("[loadDetail] Lỗi khi lấy chi tiết:", err);
        setError(`Lỗi khi tải chi tiết phương tiện: ${err.message}`);
        // Không return/văng component; cho phép user vẫn thấy form để edit thủ công
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, isEditing]);

  // Lấy danh mục và chính sách (cũng dùng fallback)
  useEffect(() => {
    const loadLists = async () => {
      try {
        const r1 = await fetchWithFallback("/Admin/danh-muc-phuong-tien");
        setDanhMucList(Array.isArray(r1.data) ? r1.data : []);
      } catch (err: any) {
        console.warn("Không lấy được danh mục:", err.message);
        // không set error chính để không block UI
      }

      try {
        const r2 = await fetchWithFallback("/Admin/chinh-sach-gia");
        // nếu backend trả { success:true, data:[...] } thì r2.data là list
        setChinhSachList(Array.isArray(r2.data) ? r2.data : []);
      } catch (err: any) {
        console.warn("Không lấy được chính sách:", err.message);
      }
    };

    loadLists();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Partial<PhuongTien> = {
      ten_phuong_tien: (formData.get("ten_phuong_tien") as string) || "",
      bien_so: (formData.get("bien_so") as string) || "",
      so_km: Number(formData.get("so_km")) || 0,
      trang_thai: (formData.get("trang_thai") as string) || "",
      gia_co_ban: Number(formData.get("gia_co_ban")) || 0,
      tien_coc_mac_dinh: Number(formData.get("tien_coc_mac_dinh")) || 0,
      loai: (formData.get("loai") as string) || "",
      danh_muc_id: Number(formData.get("danh_muc_id")) || 0,
      chinh_sach_id: Number(formData.get("chinh_sach_id")) || 0,
      so_khung: (formData.get("so_khung") as string) || "",
    };

    const path = isEditing ? `/Admin/phuong-tien/${id}` : `/Admin/phuong-tien`;
    // build candidate URLs same order used for GET but for submit pick the first reachable
    const candidates = buildCandidateUrls(path);

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        console.log("[submit] trying url", url);
        const resp = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const text = await resp.text();
        console.log(
          `[submit] ${url} -> status ${resp.status}; body start:`,
          text.slice(0, 300)
        );
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = null;
        }

        if (resp.ok) {
          if (parsed && parsed.success === false) {
            throw new Error(parsed.error || "Server trả success:false");
          }
          // success
          navigate("/admin/phuong-tien");
          return;
        } else {
          lastErr = new Error(`HTTP ${resp.status} - ${text.slice(0, 200)}`);
          console.warn("[submit] not ok -> try next", lastErr);
        }
      } catch (err: any) {
        lastErr = err;
        console.warn("[submit] error for url", url, err);
      }
    }

    setError(
      `Không thể lưu (đã thử nhiều URL). Lỗi cuối: ${
        lastErr?.message || "unknown"
      }`
    );
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
          {isEditing ? `Sửa Phương tiện ` : "Thêm Phương tiện"}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Phương tiện:</label>
            <input
              type="text"
              name="ten_phuong_tien"
              defaultValue={phuongTien?.ten_phuong_tien || ""}
              required
            />
          </div>

          <div className="form-group">
            <label>Biển số:</label>
            <input
              type="text"
              name="bien_so"
              defaultValue={phuongTien?.bien_so || ""}
              required
            />
          </div>

          <div className="form-group">
            <label>Số KM:</label>
            <input
              type="number"
              name="so_km"
              defaultValue={phuongTien?.so_km ?? 0}
              required
            />
          </div>

          <div className="form-group">
            <label>Trạng thái:</label>
            <select
              name="trang_thai"
              defaultValue={phuongTien?.trang_thai || "Hoạt động"}
              required
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Bảo trì">Bảo trì</option>
              <option value="Ngừng hoạt động">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="form-group">
            <label>Giá cơ bản:</label>
            <input
              type="number"
              name="gia_co_ban"
              defaultValue={phuongTien?.gia_co_ban ?? 0}
              required
            />
          </div>

          <div className="form-group">
            <label>Tiền cọc:</label>
            <input
              type="number"
              name="tien_coc_mac_dinh"
              defaultValue={phuongTien?.tien_coc_mac_dinh ?? 0}
              required
            />
          </div>

          <div className="form-group">
            <label>Loại:</label>
            <input
              type="text"
              name="loai"
              defaultValue={phuongTien?.loai || ""}
              required
            />
          </div>

          <div className="form-group">
            <label>Danh mục:</label>
            <select
              name="danh_muc_id"
              defaultValue={phuongTien?.danh_muc_id ?? ""}
              required
            >
              <option value="">-- Chọn danh mục --</option>
              {danhMucList.map((dm) => (
                <option key={dm.danh_muc_id} value={dm.danh_muc_id}>
                  {dm.ten_danh_muc}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Chính sách giá:</label>
            <select
              name="chinh_sach_id"
              defaultValue={phuongTien?.chinh_sach_id ?? ""}
              required
            >
              <option value="">-- Chọn chính sách --</option>
              {chinhSachList.map((cs) => (
                <option key={cs.chinh_sach_id} value={cs.chinh_sach_id}>
                  {cs.ten_chinh_sach}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Số khung:</label>
            <input
              type="text"
              name="so_khung"
              defaultValue={phuongTien?.so_khung || ""}
              required
            />
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
