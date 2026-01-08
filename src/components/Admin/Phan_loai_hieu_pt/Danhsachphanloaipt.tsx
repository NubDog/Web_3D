import React, { useState, useEffect } from "react";
import "../css/DanhMucPhuongTienList.css";

export interface Hieupt {
  hieu_xe_id: number;
  ten_hieu_xe: string;
}
export interface PhanLoai {
  phan_loai_id: number;
  ten_phan_loai: string;
  hieu_xe_id: number;
  ten_hieu_xe?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

const PhanLoaiHieuXeList: React.FC = () => {
  const [list, setList] = useState<PhanLoai[]>([]);
  const [hieuXeList, setHieuXeList] = useState<Hieupt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PhanLoai | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [toast, setToast] = useState({
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

  // Fetch dữ liệu từ cả 2 API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPhanLoai, resHieuXe] = await Promise.all([
        fetch("https://r2-api.sharkeatrice.workers.dev/api/phan-loai-hieu-xe"),
        fetch("https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien"),
      ]);

      const dataPhanLoai: ApiResponse<PhanLoai[]> = await resPhanLoai.json();
      const dataHieuXe: ApiResponse<Hieupt[]> = await resHieuXe.json();

      if (dataPhanLoai.success) setList(dataPhanLoai.data);
      if (dataHieuXe.success) setHieuXeList(dataHieuXe.data);
    } catch (err: any) {
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      ten_phan_loai: formData.get("ten_phan_loai") as string,
      hieu_xe_id: Number(formData.get("hieu_xe_id")),
    };

    // Nếu là sửa, cần gửi cả id trong body theo logic API update của bạn
    const body = editItem ? { ...payload, id: editItem.phan_loai_id } : payload;

    const url = editItem
      ? `https://r2-api.sharkeatrice.workers.dev/api/phan-loai-hieu-xe/${editItem.phan_loai_id}`
      : "https://r2-api.sharkeatrice.workers.dev/api/phan-loai-hieu-xe";

    const res = await fetch(url, {
      method: editItem ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      showToast(editItem ? "Cập nhật thành công" : "Thêm thành công");
      setIsModalOpen(false);
      fetchData();
    } else {
      showToast(result.error || "Thao tác thất bại", true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(
      `https://r2-api.sharkeatrice.workers.dev/api/phan-loai-hieu-xe/${deleteId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }), // API của bạn yêu cầu id trong body cho delete
      }
    );
    const result = await res.json();

    if (res.ok && result.success) {
      showToast("Xóa thành công");
      fetchData();
    } else {
      showToast(result.error || "Xóa thất bại", true);
    }
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  // Hàm tìm tên hiệu xe dựa trên ID để hiển thị ở bảng
  const getTenHieuXe = (id: number) => {
    return hieuXeList.find((h) => h.hieu_xe_id === id)?.ten_hieu_xe || "N/A";
  };

  if (loading) return <div className="dm-container">Đang tải...</div>;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h2 className="text">Phân loại hiệu xe</h2>
        <button
          className="btn btn-add"
          onClick={() => {
            setEditItem(null);
            setIsModalOpen(true);
          }}
        >
          + Thêm phân loại
        </button>
      </div>

      <div className="dm-table-wrapper">
        <table className="dm-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên phân loại</th>
              <th>Thuộc hiệu xe</th>
              <th>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, index) => (
              <tr key={item.phan_loai_id}>
                <td>{index + 1}</td>
                <td>{item.ten_phan_loai}</td>
                <td>{getTenHieuXe(item.hieu_xe_id)}</td>
                <td>
                  <button
                    className="btn btn-edit"
                    onClick={() => {
                      setEditItem(item);
                      setIsModalOpen(true);
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => {
                      setDeleteId(item.phan_loai_id);
                      setIsDeleteModalOpen(true);
                    }}
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
              {editItem ? "Sửa phân loại" : "Thêm phân loại mới"}
            </h2>
            <form onSubmit={handleSave} className="modal-form">
              <label className="text">
                Tên phân loại:
                <input
                  type="text"
                  name="ten_phan_loai"
                  defaultValue={editItem?.ten_phan_loai || ""}
                  required
                />
              </label>

              <label className="text">
                Chọn hiệu xe:
                <select
                  name="hieu_xe_id"
                  defaultValue={editItem?.hieu_xe_id || ""}
                  required
                >
                  <option value="">-- Chọn hiệu xe --</option>
                  {hieuXeList.map((hxe) => (
                    <option key={hxe.hieu_xe_id} value={hxe.hieu_xe_id}>
                      {hxe.ten_hieu_xe}
                    </option>
                  ))}
                </select>
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
            <p>Bạn có chắc chắn muốn xóa phân loại này không?</p>
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

export default PhanLoaiHieuXeList;
