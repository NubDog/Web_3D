import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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
  // States for the list, loading, and errors
  const [phuongTien, setPhuongTien] = useState<PhuongTien[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for Modals (Chỉ giữ lại modal Xóa)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    return (
      <div className="phuong-tien-container p-8 bg-gray-50 rounded-xl shadow-lg m-8 max-w-6xl mx-auto overflow-x-auto">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="phuong-tien-container p-8 bg-gray-50 rounded-xl shadow-lg m-8 max-w-6xl mx-auto overflow-x-auto">
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="phuong-tien-container p-8 bg-gray-50 rounded-xl shadow-lg my-8 max-w-7xl mx-auto font-sans">
      <div className="table-header flex justify-between items-center mb-6">
        <h2 className="title text-2xl font-semibold text-gray-800">
          Danh sách Phương tiện
        </h2>
        {/* Nút Thêm bây giờ là một Link */}
        <Link to="them" className="add-button-link no-underline">
          <button className="add-button bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-colors">
            + Thêm Phương tiện
          </button>
        </Link>
      </div>

      <div className="table-responsive overflow-x-auto rounded-lg shadow-md">
        <table className="phuong-tien-table min-w-full bg-white border-collapse rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">STT</th>
              <th className="py-3 px-6 text-left">Tên Phương tiện</th>
              <th className="py-3 px-6 text-left">Biển số</th>
              <th className="py-3 px-6 text-left">Trạng thái</th>
              <th className="py-3 px-6 text-left">Giá cơ bản</th>
              <th className="py-3 px-6 text-left">Danh mục</th>
              <th className="py-3 px-6 text-left">Chính sách</th>
              <th className="py-3 px-6 text-left">Số khung</th>
              <th className="py-3 px-6 text-left">Số Km đã đi</th>
              <th className="py-3 px-6 text-center">Chức năng</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {phuongTien.map((item, index) => (
              <tr
                key={item.phuong_tien_id}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="py-3 px-6 text-left">{item.ten_phuong_tien}</td>
                <td className="py-3 px-6 text-left">{item.bien_so}</td>
                <td className="py-3 px-6 text-left">
                  <span
                    className={`status py-1 px-3 rounded-full text-xs font-semibold ${
                      item.trang_thai === "Sẵn sàng"
                        ? "bg-green-500 text-white"
                        : item.trang_thai === "Bảo trì"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {item.trang_thai == "DA_DAT"? "Đã Đặt":  item.trang_thai == "SAN_SANG"? "Sẵn sàng" : "Bảo trì"}
                  </span>
                </td>
                <td className="py-3 px-6 text-left">
                  {item.gia_co_ban.toLocaleString("vi-VN")} VNĐ
                </td>
                <td className="py-3 px-6 text-left">{item.ten_danh_muc}</td>
                <td className="py-3 px-6 text-left">{item.ten_chinh_sach}</td>
                <td className="py-3 px-6 text-left">{item.so_khung}</td>
                <td className="py-3 px-6 text-left">{item.so_km}</td>
                <td className="py-3 px-6 text-center">
                  <div className="action-buttons flex item-center justify-center space-x-2">
                    {/* Nút Sửa bây giờ là một Link */}
                    <Link to={`them/${item.phuong_tien_id}`}>
                      <button className="btn btn-edit bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 transition-colors">
                        Sửa
                      </button>
                    </Link>
                    <button
                      className="btn btn-delete bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600 transition-colors"
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

      {/* Modal Xóa */}
      {isDeleteModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="modal-content-small bg-white p-8 rounded-xl text-center max-w-sm w-full shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Xác nhận xóa
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa phương tiện này không? Hành động này
              không thể hoàn tác.
            </p>
            <div className="form-actions flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-300 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                onClick={confirmDelete}
                className="btn-danger bg-red-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-red-600 transition-colors"
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
          className={`toast fixed bottom-8 right-8 py-3 px-6 rounded-lg text-white shadow-lg transition-opacity duration-300 z-50 ${
            toast.isError ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default PhuongTienList;
