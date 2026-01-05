import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface BaoTri {
  bao_tri_id: number;
  ngay_tao: string;
  trang_thai: string;
  ten_nhan_vien: string;
  ten_phuong_tien: string;
  don_thue_id: number;
  mo_ta: string;
  chi_phi: number;
  ngay_cap_nhat: string;
}

const ITEMS_PER_PAGE = 10;

const BaoTritrangthai: React.FC = () => {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const [baoTris, setBaoTris] = useState<BaoTri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageTitles: { [key: string]: string } = {
    cho_duyet: "Bảo Trì Chờ Duyệt",
    da_duyet: "Bảo Trì Đã Duyệt",
    dang_len_lich: "Bảo Trì Đang Lên Lịch",
    dang_bao_tri: "Bảo Trì Đang Thực Hiện",
    cho_kiem_tra_ban_giao: "Bảo Trì Chờ Kiểm Tra/Bàn Giao",
    da_hoan_thanh: "Bảo Trì Đã Hoàn Thành",
    da_huy: "Bảo Trì Đã Hủy",
  };

  const title = status ? pageTitles[status] : "Danh Sách Bảo Trì";

  // ✅ Gọi API danh sách bảo trì
  const fetchBaoTri = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let apiUrl = "https://r2-api.sharkeatrice.workers.dev/Admin/baotri";
      if (status && status !== "all") {
        apiUrl += `?status=${status.toUpperCase()}`;
      }

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setBaoTris(result.data);
      } else {
        throw new Error(result.error || "Không thể tải danh sách bảo trì.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchBaoTri();
  }, [fetchBaoTri]);

  // ✅ Lọc tìm kiếm
  const filteredBaoTris = useMemo(() => {
    return baoTris.filter(
      (bt) =>
        bt.ten_nhan_vien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bt.ten_phuong_tien?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [baoTris, searchTerm]);

  // ✅ Phân trang
  const totalPages = Math.ceil(filteredBaoTris.length / ITEMS_PER_PAGE);
  const currentBaoTris = filteredBaoTris.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRowClick = (baoTriId: number) => {
    navigate(`/admin/bao_tri/chitiet/${baoTriId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <div className="admin-container">
        <p>Đang tải danh sách bảo trì...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container error-message">
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>
        {title} ({filteredBaoTris.length})
      </h1>

      <div className="action-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm theo nhân viên, phương tiện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchBaoTri}>Tải lại</button>
      </div>

      {baoTris.length === 0 ? (
        <p>Không có bảo trì nào.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Nhân Viên</th>
                <th>Phương Tiện</th>
                <th>Mô tả</th>
                <th>Chi Phí</th>
                <th>Ngày Tạo</th>
                <th>Ngày Cập Nhật</th>
              </tr>
            </thead>
            <tbody>
              {currentBaoTris.map((bt, index) => (
                <tr
                  key={bt.bao_tri_id}
                  onClick={() => handleRowClick(bt.bao_tri_id)}
                >
                  <td className="text1">{index + 1}</td>
                  <td className="text1">{bt.ten_nhan_vien}</td>
                  <td className="text1">{bt.ten_phuong_tien}</td>
                  <td className="text1">{bt.mo_ta}</td>
                  <td className="text1">{bt.chi_phi}</td>
                  <td className="text1">{formatDate(bt.ngay_tao)}</td>
                  <td className="text1">{formatDate(bt.ngay_cap_nhat)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BaoTritrangthai;
