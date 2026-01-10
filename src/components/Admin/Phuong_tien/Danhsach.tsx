import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "../css/PhuongTienList.css";
import Pagination from "../Pagination";

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
  gia_thue: number;
  phan_loai_id: number;
  ten_phan_loai?: string;
  hanBaoTri?: string;
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

  //lọc
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPolicy, setFilterPolicy] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  //phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const uniqueCategories = useMemo(
    () =>
      [
        ...new Set(phuongTien.map((pt) => pt.ten_danh_muc).filter(Boolean)),
      ] as string[],
    [phuongTien]
  );

  const uniquePolicies = useMemo(
    () =>
      [
        ...new Set(phuongTien.map((pt) => pt.ten_chinh_sach).filter(Boolean)),
      ] as string[],
    [phuongTien]
  );

  // === BƯỚC 3: LOGIC LỌC CHÍNH ===
  const filteredPhuongTien = useMemo(() => {
    const parsedMinPrice = minPrice ? parseFloat(minPrice) : 0;
    const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : Infinity;

    return phuongTien.filter((item) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTermLower === "" ||
        item.ten_phuong_tien.toLowerCase().includes(searchTermLower) ||
        item.bien_so.toLowerCase().includes(searchTermLower);

      const matchesStatus =
        filterStatus === "" || item.trang_thai === filterStatus;
      const matchesCategory =
        filterCategory === "" || item.ten_danh_muc === filterCategory;
      const matchesPolicy =
        filterPolicy === "" || item.ten_chinh_sach === filterPolicy;
      const matchesPrice =
        item.gia_thue >= parsedMinPrice && item.gia_thue <= parsedMaxPrice;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPolicy &&
        matchesPrice
      );
    });
  }, [
    phuongTien,
    searchTerm,
    filterStatus,
    filterCategory,
    filterPolicy,
    minPrice,
    maxPrice,
  ]);

  // Function to display Toast
  const showToast = (message: string, isError = false) => {
    setToast({ message, isError, show: true });
    setTimeout(() => {
      setToast({ message: "", isError: false, show: false });
    }, 3000);
  };

  // Fetch data from API
  const fetchPhuongTien = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://r2-api.sharkeatrice.workers.dev/Admin/phuong-tien`
      );
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPhuongTien]);

  const totalPages = Math.ceil(filteredPhuongTien.length / itemsPerPage);
  const paginatedPhuongTien = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPhuongTien.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPhuongTien, currentPage, itemsPerPage]);

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
        `https://r2-api.sharkeatrice.workers.dev/Admin/phuong-tien/${phuongTienIdToDelete}`,
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
  const formatDateTimehanbaotri = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };
  const formatDateTimecapnhattao = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="filter-toggle-button"
          >
            Bộ lọc
          </button>
          <Link to="them" className="add-button-link no-underline">
            <button className="add-button bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-colors">
              + Thêm Phương tiện
            </button>
          </Link>
        </div>
      </div>

      {isFilterVisible && (
        <div className="filter-bar">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Tìm theo tên, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input filter-search-input"
            />
            <input
              type="number"
              placeholder="Giá thuê từ..."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="filter-input"
            />
            <input
              type="number"
              placeholder="Giá thuê đến..."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SAN_SANG">Sẵn sàng</option>
              <option value="DA_DAT">Đã Đặt</option>
              <option value="BAO_TRI">Bảo trì</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả danh mục</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filterPolicy}
              onChange={(e) => setFilterPolicy(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả chính sách</option>
              {uniquePolicies.map((pol) => (
                <option key={pol} value={pol}>
                  {pol}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("");
                setFilterCategory("");
                setFilterPolicy("");
                setMinPrice("");
                setMaxPrice("");
              }}
              className="reset-button"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="table-responsive overflow-x-auto rounded-lg shadow-md">
        <table className="phuong-tien-table min-w-full bg-white border-collapse rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">STT</th>
              <th className="py-3 px-6 text-left">Tên Phương tiện</th>
              <th className="py-3 px-6 text-left">Biển số</th>
              <th className="py-3 px-6 text-left">Trạng thái</th>
              <th className="py-3 px-6 text-left">Danh mục</th>
              <th className="py-3 px-6 text-left">Phân loại</th>
              <th className="py-3 px-6 text-left">Chính sách</th>
              <th className="py-3 px-6 text-left">Số khung</th>
              <th className="py-3 px-6 text-left">Số Km đã đi</th>
              <th className="py-3 px-6 text-left">Giá Thuê</th>
              <th className="py-3 px-6 text-left">Hạn Bảo Hành</th>
              <th className="py-3 px-6 text-left">Ngày Tạo</th>
              <th className="py-3 px-6 text-left">Ngày Cập Nhật</th>
              <th className="py-3 px-6 text-center">Chức năng</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {paginatedPhuongTien.map((item, index) => (
              <tr
                key={item.phuong_tien_id}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-3 px-6 text-left">{item.ten_phuong_tien}</td>
                <td className="py-3 px-6 text-left">{item.bien_so}</td>
                <td className="py-3 px-6 text-left">
                  <span
                    className={`status py-1 px-3 rounded-full text-xs font-semibold ${
                      item.trang_thai === "DA_DAT"
                        ? "bg-grey-500y text-white"
                        : item.trang_thai === "SAN_SANG"
                        ? "bg-green-500y text-white"
                        : item.trang_thai === "BAO_TRI"
                        ? "bg-red-500y text-white"
                        : "bg-yelow-500y text-white"
                    }`}
                  >
                    {item.trang_thai == "DA_DAT"
                      ? "Đã Đặt"
                      : item.trang_thai == "SAN_SANG"
                      ? "Sẵn sàng"
                      : item.trang_thai == "BAO_TRI"
                      ? "Bảo trì"
                      : "Chờ Duyệt"}
                  </span>
                </td>

                <td className="py-3 px-6 text-left">{item.ten_danh_muc}</td>
                <td className="py-3 px-6 text-left">{item.ten_phan_loai}</td>
                <td className="py-3 px-6 text-left">{item.ten_chinh_sach}</td>
                <td className="py-3 px-6 text-left">{item.so_khung}</td>
                <td className="py-3 px-6 text-left">{item.so_km}</td>
                <td className="py-3 px-6 text-left">
                  {item.gia_thue.toLocaleString("vi-VN")} VND
                </td>
                <td className="py-3 px-6 text-left">
                  {formatDateTimehanbaotri(item.hanBaoTri)}
                </td>
                <td className="py-3 px-6 text-left">
                  {formatDateTimecapnhattao(item.ngay_tao)}
                </td>
                <td className="py-3 px-6 text-left">
                  {formatDateTimecapnhattao(item.ngay_cap_nhat)}
                </td>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default PhuongTienList;
