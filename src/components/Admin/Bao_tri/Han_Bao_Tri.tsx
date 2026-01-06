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
}

const ITEMS_PER_PAGE = 10;

const HanBaoTri: React.FC = () => {
  const [ptDenHanBaoTri, setPtDenHanBaoTri] = useState<PTDenHanBaoTri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- State cho Modal ---
  const [showModal, setShowModal] = useState(false);
  const [selectedPT, setSelectedPT] = useState<PTDenHanBaoTri | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mo_ta: "Bảo trì định kỳ",
    chi_phi: 0,
  });

  const { currentUser } = useAuth(); // Lấy thông tin người dùng đang đăng nhập
  console.log("Dữ liệu từ useAuth:", { currentUser });
  const navigate = useNavigate();
  const API_URL = "https://r2-api.sharkeatrice.workers.dev";

  // ✅ Gọi API lấy danh sách phương tiện sắp đến hạn
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

  useEffect(() => {
    fetchPTToiHan();
  }, [fetchPTToiHan]);

  // ✅ Mở khung nhập liệu
  const handleOpenModal = (pt: PTDenHanBaoTri) => {
    setSelectedPT(pt);
    setFormData({ mo_ta: "Bảo trì định kỳ", chi_phi: 0 });
    setShowModal(true);
  };

  // ✅ Gửi dữ liệu bảo trì về Backend
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
          nhan_vien_tao: currentUser.nguoi_dung_id, // ID người dùng từ AuthContext
          mo_ta: formData.mo_ta || "Bảo trì định kỳ",
          chi_phi: Number(formData.chi_phi) || 0,
          trang_thai: "CHO_DUYET",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          "✅ Thêm bảo trì thành công. Trạng thái xe đã chuyển sang BAO_TRI."
        );
        setShowModal(false);
        fetchPTToiHan(); // Tải lại danh sách (xe vừa bảo trì sẽ không còn hiện ở đây)
      } else {
        alert("❌ Lỗi: " + result.error);
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Lọc tìm kiếm
  const filteredPT = useMemo(() => {
    return ptDenHanBaoTri.filter(
      (pt) =>
        pt.ten_phuong_tien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pt.bien_so?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ptDenHanBaoTri, searchTerm]);

  // ✅ Phân trang
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
  if (error)
    return (
      <div className="admin-container error-message">
        <p>Lỗi: {error}</p>
      </div>
    );

  return (
    <div className="admin-container">
      <h1>Phương Tiện Sắp Đến Hạn Bảo Trì ({filteredPT.length})</h1>

      <div className="action-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên xe, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchPTToiHan}>Tải lại</button>
      </div>

      {filteredPT.length === 0 ? (
        <p>Không có phương tiện nào sắp đến hạn bảo trì.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Hình ảnh</th>
                <th>Tên Phương Tiện</th>
                <th>Biển Số</th>
                <th>Hạn Bảo Trì</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {currentPT.map((pt, index) => (
                <tr key={pt.phuong_tien_id}>
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td>
                    <img
                      src={pt.img}
                      alt={pt.ten_phuong_tien}
                      style={{ width: "50px", borderRadius: "4px" }}
                    />
                  </td>
                  <td>
                    <strong>{pt.ten_phuong_tien}</strong>
                  </td>
                  <td>{pt.bien_so}</td>
                  <td style={{ color: "red", fontWeight: "bold" }}>
                    {formatDate(pt.hanBaoTri)}
                  </td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(pt)}
                      style={{ padding: "5px 12px", cursor: "pointer" }}
                    >
                      Bảo Trì
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <span>
              Trang {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </>
      )}

      {/* --- MODAL KHUNG NHẬP --- */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Lập Phiếu Bảo Trì</h2>
            <p>
              Xe: <strong>{selectedPT?.ten_phuong_tien}</strong> (
              {selectedPT?.bien_so})
            </p>
            <hr />

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Nội dung bảo trì:
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                rows={3}
                value={formData.mo_ta}
                onChange={(e) =>
                  setFormData({ ...formData, mo_ta: e.target.value })
                }
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Chi phí dự kiến (VNĐ):
              </label>
              <input
                type="number"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
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
                style={{
                  padding: "8px 16px",
                  background: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBaoTri}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Đang xử lý..." : "Xác nhận Bảo trì"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CSS styles đơn giản cho Modal ---
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
