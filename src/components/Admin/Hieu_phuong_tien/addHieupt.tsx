import React, { useState, useEffect } from "react";
import "../css/DanhMucPhuongTienList.css";

export interface Hieupt {
  id: number;
  ten_hieu: string;
}

interface ApiResponse {
  success: boolean;
  data: Hieupt[];
  message?: string;
  error?: string;
}

const HieuPhuongTienList: React.FC = () => {
  const [list, setList] = useState<Hieupt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Hieupt | null>(null);

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

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien"
      );
      const result: ApiResponse = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error);
      setList(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= SAVE =================
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ten_hieu = new FormData(e.currentTarget).get("ten_hieu") as string;

    if (!ten_hieu) {
      showToast("Tên hiệu không được để trống", true);
      return;
    }

    const url = editItem
      ? `https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien/${editItem.id}`
      : "https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien";

    const method = editItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ten_hieu }),
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

  // ================= DELETE =================
  const confirmDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(
      `https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien/${deleteId}`,
      { method: "DELETE" }
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

  // ================= UI =================
  if (loading) return <div className="dm-container">Đang tải...</div>;
  if (error) return <div className="dm-container">Lỗi: {error}</div>;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h2>Hiệu phương tiện</h2>
        <button
          className="btn btn-add"
          onClick={() => {
            setEditItem(null);
            setIsModalOpen(true);
          }}
        >
          + Thêm hiệu
        </button>
      </div>

      <table className="dm-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên hiệu</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.ten_hieu}</td>
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
                    setDeleteId(item.id);
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

      {/* MODAL ADD / EDIT */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editItem ? "Sửa hiệu" : "Thêm hiệu"}</h3>
            <form onSubmit={handleSave}>
              <input
                name="ten_hieu"
                defaultValue={editItem?.ten_hieu || ""}
                placeholder="Tên hiệu"
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Bạn chắc chắn muốn xóa?</p>
            <button onClick={confirmDelete}>Xóa</button>
            <button onClick={() => setIsDeleteModalOpen(false)}>Hủy</button>
          </div>
        </div>
      )}

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

export default HieuPhuongTienList;
