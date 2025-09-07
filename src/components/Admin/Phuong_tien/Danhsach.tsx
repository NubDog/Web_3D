import React, { useState, useEffect, type FormEvent } from "react";
import "../css/PhuongTienList.css"; // Import your CSS file for styling

// Define the data types
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

export interface ApiResponse {
  success: boolean;
  data: PhuongTien[];
}

// The main component
const PhuongTienList: React.FC = () => {
  const API_BASE_URL = ""; // Replace with your actual API URL

  // States for the list, loading, and errors
  const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // States for managing the current item
  const [currentPhuongTien, setCurrentPhuongTien] =
    useState<Partial<PhuongTien> | null>(null);
  const [phuongTienIdToDelete, setPhuongTienIdToDelete] = useState<
    number | null
  >(null);

  // State for Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    isError: boolean;
    show: boolean;
  }>({
    message: "",
    isError: false,
    show: false,
  });

  // Function to display Toast
  const showToast = (message: string, isError = false) => {
    setToast({ message, isError, show: true });
    setTimeout(() => {
      setToast({ message: "", isError: false, show: false });
    }, 3000);
  };

  // Function to format dates
  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(dateString));
    } catch (e) {
      return "N/A";
    }
  };

  // Fetch data from API
  const fetchPhuongTien = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/Admin/phuong-tien`);
      if (!response.ok) throw new Error("Network response was not ok");
      const result: ApiResponse = await response.json();
      if (result.success) {
        setPhuongTien(result.data);
      } else {
        throw new Error("Failed to fetch data.");
      }
    } catch (err: any) {
      setError(`Lỗi khi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPhuongTien();
  }, []);

  // Open the Add/Edit Modal
  const handleOpenModal = (item: PhuongTien | null = null) => {
    setCurrentPhuongTien(item ? { ...item } : {});
    setIsModalOpen(true);
  };

  // Close the Add/Edit Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPhuongTien(null);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: Partial<PhuongTien> = {
      ten_phuong_tien: formData.get("ten_phuong_tien") as string,
      bien_so: formData.get("bien_so") as string,
      so_km: Number(formData.get("so_km")),
      trang_thai: formData.get("trang_thai") as string,
      gia_co_ban: Number(formData.get("gia_co_ban")),
      tien_coc_mac_dinh: Number(formData.get("tien_coc_mac_dinh")),
      loai: formData.get("loai") as string,
      danh_muc_id: Number(formData.get("danh_muc_id")),
      chinh_sach_id: Number(formData.get("chinh_sach_id")),
      so_khung: formData.get("so_khung") as string,
    };

    const url = currentPhuongTien?.phuong_tien_id
      ? `${API_BASE_URL}/api/Admin/phuong-tien/${currentPhuongTien.phuong_tien_id}`
      : `${API_BASE_URL}/api/Admin/phuong-tien`;
    const method = currentPhuongTien?.phuong_tien_id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showToast(result.message || "Thao tác thành công!");
        handleCloseModal();
        fetchPhuongTien(); // Re-fetch the data to update the table
      } else {
        throw new Error(result.error || "Thao tác thất bại.");
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`, true);
    }
  };

  // Open the Delete Confirmation Modal
  const handleDeleteClick = (id: number) => {
    setPhuongTienIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirm and execute delete action
  const confirmDelete = async () => {
    if (!phuongTienIdToDelete) return;
    try {
      const response = await fetch(
        `/api/Admin/phuong-tien/${phuongTienIdToDelete}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        showToast(result.message || "Xóa thành công!");
        fetchPhuongTien();
      } else {
        throw new Error(result.error || "Xóa thất bại.");
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`, true);
    } finally {
      setIsDeleteModalOpen(false);
      setPhuongTienIdToDelete(null);
    }
  };

  // JSX render logic
  if (loading) {
    return <div className="phuong-tien-container">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="phuong-tien-container">Lỗi: {error}</div>;
  }

  return (
    <div className="phuong-tien-container">
      <div className="table-header">
        <h2 className="title">Danh sách Phương tiện</h2>
        <button className="add-button" onClick={() => handleOpenModal()}>
          + Thêm Phương tiện
        </button>
      </div>

      <div className="table-responsive">
        <table className="phuong-tien-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên Phương tiện</th>
              <th>Biển số</th>
              <th>Trạng thái</th>
              <th>Giá cơ bản</th>
              <th>Danh mục</th>
              <th>Chính sách</th>
              <th>Số khung</th>
              <th>Số Km đã đi</th>
              <th>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {phuongTien.map((item, index) => (
              <tr key={item.phuong_tien_id}>
                <td>{index + 1}</td>
                <td>{item.ten_phuong_tien}</td>
                <td>{item.bien_so}</td>
                <td>
                  <span
                    className={`status ${
                      item.trang_thai === "Hoạt động"
                        ? "active"
                        : item.trang_thai === "Bảo trì"
                        ? "maintenance"
                        : "inactive"
                    }`}
                  >
                    {item.trang_thai}
                  </span>
                </td>
                <td>{item.gia_co_ban.toLocaleString("vi-VN")} VNĐ</td>
                <td>{item.ten_danh_muc}</td>
                <td>{item.ten_chinh_sach}</td>
                <td>{item.so_khung}</td>
                <td>{item.so_km}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-edit"
                      onClick={() => handleOpenModal(item)}
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

      {/* Thêm Modal cho Thêm/Sửa */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <h2>
                {currentPhuongTien?.phuong_tien_id
                  ? "Sửa Phương tiện"
                  : "Thêm Phương tiện"}
              </h2>
              <div className="form-group">
                <label>Tên Phương tiện:</label>
                <input
                  type="text"
                  name="ten_phuong_tien"
                  defaultValue={currentPhuongTien?.ten_phuong_tien}
                  required
                />
              </div>
              <div className="form-group">
                <label>Biển số:</label>
                <input
                  type="text"
                  name="bien_so"
                  defaultValue={currentPhuongTien?.bien_so}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số KM:</label>
                <input
                  type="number"
                  name="so_km"
                  defaultValue={currentPhuongTien?.so_km}
                  required
                />
              </div>
              <div className="form-group">
                <label>Trạng thái:</label>
                <select
                  name="trang_thai"
                  defaultValue={currentPhuongTien?.trang_thai || "Hoạt động"}
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
                  defaultValue={currentPhuongTien?.gia_co_ban}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tiền cọc:</label>
                <input
                  type="number"
                  name="tien_coc_mac_dinh"
                  defaultValue={currentPhuongTien?.tien_coc_mac_dinh}
                  required
                />
              </div>
              <div className="form-group">
                <label>Loại:</label>
                <input
                  type="text"
                  name="loai"
                  defaultValue={currentPhuongTien?.loai}
                  required
                />
              </div>
              <div className="form-group">
                <label>Danh mục ID:</label>
                <input
                  type="number"
                  name="danh_muc_id"
                  defaultValue={currentPhuongTien?.danh_muc_id}
                  required
                />
              </div>
              <div className="form-group">
                <label>Chính sách ID:</label>
                <input
                  type="number"
                  name="chinh_sach_id"
                  defaultValue={currentPhuongTien?.chinh_sach_id}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số khung:</label>
                <input
                  type="text"
                  name="so_khung"
                  defaultValue={currentPhuongTien?.so_khung}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit">Lưu</button>
              </div>
            </form>
            <button className="modal-close" onClick={handleCloseModal}>
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-small">
            <h2>Xác nhận xóa</h2>
            <p>
              Bạn có chắc chắn muốn xóa phương tiện này không? Hành động này
              không thể hoàn tác.
            </p>
            <div className="form-actions">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)}>
                Hủy
              </button>
              <button
                type="submit"
                onClick={confirmDelete}
                className="btn-danger"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div
          className={`toast ${toast.isError ? "toast-error" : "toast-success"}`}
        >
          <p>{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default PhuongTienList;
