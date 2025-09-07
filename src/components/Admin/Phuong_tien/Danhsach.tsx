export interface PhuongTien {
  phuong_tien_id: number;
  ten_phuong_tien: string;
  bien_so: string;
  so_km: number;
  trang_thai: string;
  ten_danh_muc: string;
  ten_chinh_sach: string;
  gia_co_ban: number;
  tien_coc_mac_dinh: number;
}

export interface ApiResponse {
  success: boolean;
  data: PhuongTien[];
}
import React, { useState, useEffect } from "react";
import "../css/PhuongTienList.css"; // Import file CSS để tạo style

const PhuongTienList: React.FC = () => {
  const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhuongTien = async () => {
      try {
        const response = await fetch("/api/Admin/phuong-tien");

        if (!response.ok) {
          throw new Error("Lỗi khi tải dữ liệu từ API.");
        }

        const data: ApiResponse = await response.json();
        setPhuongTien(data.data);
      } catch (err) {
        setError("Không thể kết nối đến máy chủ hoặc dữ liệu không hợp lệ.");
        console.error("Lỗi khi fetch dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhuongTien();
  }, []);

  // Các hàm xử lý click (chỉ mang tính demo, chưa xử lý logic)
  const handleAddClick = () => {
    alert("Thêm phương tiện mới - Logic chưa được xử lý!");
  };

  const handleViewClick = (id: number) => {
    alert(`Xem chi tiết phương tiện có ID: ${id}`);
  };

  const handleEditClick = (id: number) => {
    alert(`Sửa phương tiện có ID: ${id}`);
  };

  const handleDeleteClick = (id: number) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phương tiện có ID: ${id}?`)) {
      alert(`Đã xóa phương tiện có ID: ${id}`);
      // Ở đây sẽ gọi API xóa thực tế
    }
  };

  if (loading) {
    return (
      <div className="phuong-tien-container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="phuong-tien-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="phuong-tien-container">
      <div className="table-header">
        <h2 className="title">Danh sách Phương tiện</h2>
        <button className="add-button" onClick={handleAddClick}>
          + Thêm Phương tiện
        </button>
      </div>

      <div className="table-responsive">
        <table className="phuong-tien-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Phương tiện</th>
              <th>Biển số</th>
              <th>Trạng thái</th>
              <th>Giá cơ bản</th>
              <th>Danh mục</th>
              <th>Chính sách</th>
              <th>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {phuongTien.map((item) => (
              <tr key={item.phuong_tien_id}>
                <td>{item.phuong_tien_id}</td>
                <td>{item.ten_phuong_tien}</td>
                <td>{item.bien_so}</td>
                <td>
                  <span
                    className={`status ${
                      item.trang_thai === "Hoạt động" ? "active" : "maintenance"
                    }`}
                  >
                    {item.trang_thai}
                  </span>
                </td>
                <td>{item.gia_co_ban.toLocaleString("vi-VN")} VNĐ</td>
                <td>{item.ten_danh_muc}</td>
                <td>{item.ten_chinh_sach}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-view"
                      onClick={() => handleViewClick(item.phuong_tien_id)}
                    >
                      Xem
                    </button>
                    <button
                      className="btn btn-edit"
                      onClick={() => handleEditClick(item.phuong_tien_id)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => handleDeleteClick(item.phuong_tien_id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhuongTienList;
