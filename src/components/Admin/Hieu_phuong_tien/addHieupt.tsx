import React, { useState, useEffect } from "react";
import "../css/DanhMucPhuongTienList.css";

export interface Hieupt {
  hieu_xe_id: number;
  ten_hieu_xe: string;
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ten_hieu_xe = new FormData(e.currentTarget).get(
      "ten_hieu_xe"
    ) as string;

    if (!ten_hieu_xe) {
      showToast("Tên hiệu không được để trống", true);
      return;
    }

    const url = editItem
      ? `https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien/${editItem.hieu_xe_id}`
      : "https://r2-api.sharkeatrice.workers.dev/api/hieu-phuong-tien";

    const method = editItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ten_hieu_xe }),
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

  if (loading) return <div className="dm-container">Đang tải...</div>;
  if (error) return <div className="dm-container">Lỗi: {error}</div>;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h2 className="text">Hiệu phương tiện</h2>
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

      <div className="dm-table-wrapper">
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
              <tr key={item.hieu_xe_id}>
                <td>{index + 1}</td>
                <td>{item.ten_hieu_xe}</td>
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
                      setDeleteId(item.hieu_xe_id);
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
              {editItem ? "Sửa hiệu xe" : "Thêm hiệu xe"}
            </h2>
            <form onSubmit={handleSave} className="modal-form">
              <label className="text">
                Tên hiệu phương tiện:
                <input
                  type="text"
                  name="ten_hieu_xe"
                  className="text"
                  defaultValue={editItem?.ten_hieu_xe || ""}
                  required
                  autoFocus
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
            <p>Bạn có chắc chắn muốn xóa hiệu xe này không?</p>
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

export default HieuPhuongTienList;
