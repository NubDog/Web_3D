import React, { useState, useEffect } from "react";
import "../css/DanhMucPhuongTienList.css";

export interface DanhMuc {
  danh_muc_id: number;
  ten_danh_muc: string;
  mo_ta: string;
}

export interface ApiResponse {
  success: boolean;
  data: DanhMuc[];
  message?: string;
  error?: string;
}

const DanhMucPhuongTienList: React.FC = () => {
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<DanhMuc | null>(null);

  // Modal xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [danhMucIdToDelete, setDanhMucIdToDelete] = useState<number | null>(
    null
  );

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    isError: boolean;
    show: boolean;
  }>({
    message: "",
    isError: false,
    show: false,
  });

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError, show: true });
    setTimeout(
      () => setToast({ message: "", isError: false, show: false }),
      3000
    );
  };

  // Fetch API
  const fetchDanhMuc = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien`);
      if (!res.ok) throw new Error("Network response was not ok");
      const result: ApiResponse = await res.json();
      if (result.success) {
        setDanhMuc(result.data);
      } else {
        throw new Error(result.error || "Không thể tải dữ liệu");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDanhMuc();
  }, []);

  // Thêm/Sửa
  const openAddModal = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: DanhMuc) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ten_danh_muc = formData.get("ten_danh_muc") as string;
    const mo_ta = formData.get("mo_ta") as string;

    try {
      let res, result;
      if (editItem) {
        // update
        res = await fetch(
          `https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien/${editItem.danh_muc_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ten_danh_muc, mo_ta }),
          }
        );
      } else {
        // create
        res = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/danh-muc-phuong-tien`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ten_danh_muc, mo_ta }),
        });
      }
      result = await res.json();
      if (res.ok && result.success) {
        showToast(
          result.message ||
            (editItem ? "Cập nhật thành công!" : "Thêm thành công!")
        );
        fetchDanhMuc();
        setIsModalOpen(false);
      } else {
        throw new Error(result.error || "Thao tác thất bại");
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`, true);
    }
  };

  // Xóa
  const handleDeleteClick = (id: number) => {
    setDanhMucIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!danhMucIdToDelete) return;
    try {
      const res = await fetch(
        `https://r2-api.sharkeatrice.workers.dev/api/Admin/danh-muc-phuong-tien/${danhMucIdToDelete}`,
        {
          method: "DELETE",
        }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(result.message || "Xóa thành công!");
        fetchDanhMuc();
      } else {
        throw new Error(result.error || "Xóa thất bại.");
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`, true);
    } finally {
      setIsDeleteModalOpen(false);
      setDanhMucIdToDelete(null);
    }
  };

  // UI
  if (loading) return <div className="dm-container">Đang tải dữ liệu...</div>;
  if (error) return <div className="dm-container">Lỗi: {error}</div>;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h2 className="text">Danh mục phương tiện</h2>
        <button className="btn btn-add" onClick={openAddModal}>
          + Thêm danh mục
        </button>
      </div>

      <div className="dm-table-wrapper">
        <table className="dm-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {danhMuc.map((item, index) => (
              <tr key={item.danh_muc_id}>
                <td>{index + 1}</td>
                <td>{item.ten_danh_muc}</td>
                <td>{item.mo_ta || "—"}</td>
                <td>
                  <button
                    className="btn btn-edit"
                    onClick={() => openEditModal(item)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDeleteClick(item.danh_muc_id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text">
              {editItem ? "Sửa danh mục" : "Thêm danh mục"}
            </h2>
            <form onSubmit={handleSave} className="modal-form">
              <label className="text">
                Tên danh mục:
                <input
                  type="text"
                  name="ten_danh_muc"
                  className="text"
                  defaultValue={editItem?.ten_danh_muc || ""}
                  required
                />
              </label>
              <label className="text">
                Mô tả:
                <input
                  type="text"
                  name="mo_ta"
                  className="text"
                  defaultValue={editItem?.mo_ta || ""}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-cancel"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-save">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text">Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa danh mục này không?</p>
            <div className="modal-actions">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-cancel"
              >
                Hủy
              </button>
              <button onClick={confirmDelete} className="btn btn-delete">
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
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default DanhMucPhuongTienList;
