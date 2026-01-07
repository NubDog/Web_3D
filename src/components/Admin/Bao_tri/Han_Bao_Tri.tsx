import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface PTDenHanBaoTri {
  phuong_tien_id: number;
  ten_phuong_tien: string;
  bien_so: string;
  so_khung: string;
  img: string;
  hanBaoTri: string;
  tinh_trang_bao_tri?: string; // Thêm optional vì PT sẵn sàng có thể chưa có field này
}

const ITEMS_PER_PAGE = 10;

const HanBaoTri: React.FC = () => {
  const [ptDenHanBaoTri, setPtDenHanBaoTri] = useState<PTDenHanBaoTri[]>([]);
  const [dsPTSangSang, setDsPTSangSang] = useState<PTDenHanBaoTri[]>([]); // Danh sách PT sẵn sàng
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false); // Modal thêm thủ công
  const [selectedPT, setSelectedPT] = useState<PTDenHanBaoTri | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mo_ta: "Bảo trì định kỳ",
    chi_phi: 0,
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const API_URL = "https://r2-api.sharkeatrice.workers.dev";

  // Fetch danh sách đến hạn
  const fetchPTToiHan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/baotri/hanbaotri`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setPtDenHanBaoTri(result.data);
      } else {
        setPtDenHanBaoTri([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Fetch danh sách sẵn sàng (để thêm bảo trì chủ động)
  const fetchPTSangSang = async () => {
    try {
      const response = await fetch(`${API_URL}/api/baotri/getdsptsangsang`);
      const result = await response.json();
      if (result.success) {
        setDsPTSangSang(result.data);
        setShowAddManualModal(true);
      } else {
        alert("Không thể tải danh sách phương tiện sẵn sàng");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  useEffect(() => {
    fetchPTToiHan();
  }, [fetchPTToiHan]);

  const handleOpenModal = (pt: PTDenHanBaoTri) => {
    setSelectedPT(pt);
    setFormData({ mo_ta: "Bảo trì định kỳ", chi_phi: 0 });
    setShowModal(true);
  };

  const handleConfirmBaoTri = async () => {
    if (!selectedPT || !currentUser) {
      alert("Thiếu thông tin phương tiện hoặc nhân viên.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/baotri/addbaotri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phuong_tien_id: selectedPT.phuong_tien_id,
          nhan_vien_tao: currentUser.nguoi_dung_id,
          mo_ta: formData.mo_ta || "Bảo trì định kỳ",
          chi_phi: Number(formData.chi_phi) || 0,
          trang_thai: "CHO_DUYET",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Thêm bảo trì thành công.");
        setShowModal(false);
        setShowAddManualModal(false);
        fetchPTToiHan();
      } else {
        alert("❌ Lỗi: " + result.error);
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc tìm kiếm
  const filteredPT = useMemo(() => {
    return ptDenHanBaoTri.filter(
      (pt) =>
        pt.ten_phuong_tien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.bien_so?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.so_khung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.phuong_tien_id.toString().includes(searchTerm)
    );
  }, [ptDenHanBaoTri, searchTerm]);

  // Phân trang
  const totalPages = Math.ceil(filteredPT.length / ITEMS_PER_PAGE);
  const currentPT = filteredPT.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (isLoading)
    return (
      <div className="admin-container">
        <p>Đang tải dữ liệu...</p>
      </div>
    );

  return (
    <div className="admin-container">
      <h1>Phương Tiện Sắp Đến Hạn Bảo Trì ({filteredPT.length})</h1>

      <div
        className="action-bar"
        style={{ display: "flex", gap: "10px", alignItems: "center" }}
      >
        <div className="search-bar" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên xe, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Nút Thêm Bảo Trì Mới */}
        <button
          onClick={fetchPTSangSang}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Thêm bảo trì
        </button>

        <button
          onClick={fetchPTToiHan}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Tải lại
        </button>
      </div>

      {/* Table code giữ nguyên như cũ... */}
      <table className="admin-table">
        {/* ... (phần code table của bạn) ... */}
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã</th>
            <th>Hình ảnh</th>
            <th>Tên Phương Tiện</th>
            <th>Biển Số</th>
            <th>Hạn Bảo Trì</th>
            <th>Tình Trạng</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {currentPT.map((pt, index) => (
            <tr key={pt.phuong_tien_id}>
              <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
              <td>#{pt.phuong_tien_id}</td>
              <td>
                <img src={pt.img} alt="" style={{ width: "40px" }} />
              </td>
              <td>{pt.ten_phuong_tien}</td>
              <td>{pt.bien_so}</td>
              <td style={{ color: "red" }}>{formatDate(pt.hanBaoTri)}</td>
              <td>
                {pt.tinh_trang_bao_tri === "QUA_HAN"
                  ? "QUÁ HẠN"
                  : "SẮP ĐẾN HẠN"}
              </td>
              <td>
                <button
                  className="btn-edit"
                  onClick={() => handleOpenModal(pt)}
                >
                  Bảo Trì
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddManualModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: "900px" }}>
            <h2>Chọn phương tiện bảo trì</h2>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                marginBottom: "15px",
              }}
            >
              <table className="admin-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Mã phương tiện</th>
                    <th>Tên xe</th>
                    <th>Biển số</th>
                    <th>Số khung</th>
                    <th>Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {dsPTSangSang.map((pt) => (
                    <tr key={pt.phuong_tien_id}>
                      <td>#{pt.phuong_tien_id}</td>
                      <td>{pt.ten_phuong_tien}</td>
                      <td>{pt.bien_so}</td>
                      <td>{pt.so_khung}</td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedPT(pt);
                            setFormData({
                              mo_ta: "Bảo trì chủ động",
                              chi_phi: 0,
                            });
                            setShowAddManualModal(false);
                            setShowModal(true);
                          }}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                          }}
                        >
                          Chọn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowAddManualModal(false)}
              style={{ width: "100%", padding: "10px" }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: LẬP PHIẾU BẢO TRÌ (Dùng chung cho cả 2 trường hợp) */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Lập Phiếu Bảo Trì</h2>
            <p>
              Xe: <strong>{selectedPT?.ten_phuong_tien}</strong> -{" "}
              {selectedPT?.bien_so}
            </p>
            <hr />
            <div style={{ marginBottom: "15px" }}>
              <label>Nội dung bảo trì:</label>
              <textarea
                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                rows={3}
                value={formData.mo_ta}
                onChange={(e) =>
                  setFormData({ ...formData, mo_ta: e.target.value })
                }
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label>Chi phí dự kiến (VNĐ):</label>
              <input
                type="number"
                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                value={formData.chi_phi}
                onChange={(e) =>
                  setFormData({ ...formData, chi_phi: Number(e.target.value) })
                }
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "8px 16px" }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBaoTri}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                }}
              >
                {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles (Giữ nguyên từ code của bạn)
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "8px",
  width: "450px",
  maxWidth: "90%",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};

export default HanBaoTri;
