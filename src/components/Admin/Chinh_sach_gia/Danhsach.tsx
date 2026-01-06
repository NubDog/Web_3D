import React, { useState, useEffect } from "react";
import "../css/ChinhSachGiaList.css";

export interface ChinhSachGia {
  chinh_sach_id: number;
  ten_chinh_sach: string;
  gia_co_ban: number;
  tien_coc_mac_dinh: number;
  phi_phat_co_ban: number;
  ty_le_giam: number | null;
  ngay_tao: string;
  ngay_cap_nhat: string;
}

export interface ApiResponse {
  success: boolean;
  data: ChinhSachGia[];
  message?: string;
  error?: string;
}

const ChinhSachGiaList: React.FC = () => {
  const [list, setList] = useState<ChinhSachGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ChinhSachGia | null>(null);

  // Modal xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  // Fetch
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://r2-api.sharkeatrice.workers.dev/Admin/chinh-sach-gia"
      );
      if (!res.ok) throw new Error("Network error");
      const result: ApiResponse = await res.json();
      if (result.success) {
        setList(result.data);
      } else {
        throw new Error(result.error || "Không tải được dữ liệu");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal thêm/sửa
  const openAddModal = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };
  const openEditModal = (item: ChinhSachGia) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      TenChinhSach: formData.get("ten_chinh_sach") as string,
      GiaCoBan: Number(formData.get("gia_co_ban")),
      TienCocMacDinh: Number(formData.get("tien_coc_mac_dinh")),
      PhiPhatCoBan: Number(formData.get("phi_phat_co_ban")),
      TyLeGiam: formData.get("ty_le_giam")
        ? Number(formData.get("ty_le_giam"))
        : null,
    };

    try {
      let res, result;
      if (editItem) {
        res = await fetch(
          `https://r2-api.sharkeatrice.workers.dev/Admin/chinh-sach-gia/${editItem.chinh_sach_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(
          "https://r2-api.sharkeatrice.workers.dev/Admin/chinh-sach-gia",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }
      result = await res.json();
      if (res.ok && result.success) {
        showToast(
          result.message ||
            (editItem ? "Cập nhật thành công" : "Thêm thành công")
        );
        fetchData();
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
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(
        `https://r2-api.sharkeatrice.workers.dev/Admin/chinh-sach-gia/${deleteId}`,
        {
          method: "DELETE",
        }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(result.message || "Xóa thành công!");
        fetchData();
      } else {
        throw new Error(result.error || "Xóa thất bại");
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`, true);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  // UI
  if (loading) return <div className="dm-container">Đang tải dữ liệu...</div>;
  if (error) return <div className="dm-container">Lỗi: {error}</div>;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h2 className="caa">Chính sách giá</h2>
        <button className="btn btn-add" onClick={openAddModal}>
          + Thêm
        </button>
      </div>

      <div className="dm-table-wrapper">
        <table className="dm-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên chính sách</th>
              {/* <th>Giá cơ bản</th> */}
              <th>Tiền cọc mặc định</th>
              {/* <th>Phí phạt cơ bản</th> */}
              <th>Tỷ lệ giảm</th>
              {/* <th>Ngày tạo</th>
              <th>Ngày cập nhật</th> */}
              <th>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx) => (
              <tr key={item.chinh_sach_id}>
                <td>{idx + 1}</td>
                <td>{item.ten_chinh_sach}</td>
                {/* <td>{item.gia_co_ban}</td> */}
                <td>{item.tien_coc_mac_dinh}</td>
                {/* <td>{item.phi_phat_co_ban}</td> */}
                <td>{item.ty_le_giam ?? "—"}</td>
                {/* <td>{item.ngay_tao}</td>
                <td>{item.ngay_cap_nhat}</td> */}
                <td>
                  <button
                    className="btn btn-edit"
                    onClick={() => openEditModal(item)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDeleteClick(item.chinh_sach_id)}
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
            <h2 className="caa">
              {editItem ? "Sửa chính sách giá" : "Thêm chính sách giá"}
            </h2>
            <form onSubmit={handleSave} className="modal-form">
              <label className="caa">
                Tên chính sách:
                <input
                  type="text"
                  name="ten_chinh_sach"
                  className="caa"
                  defaultValue={editItem?.ten_chinh_sach || ""}
                  required
                />
              </label>
              <label className="caa">
                Giá cơ bản:
                <input
                  type="number"
                  name="gia_co_ban"
                  className="caa"
                  defaultValue={editItem?.gia_co_ban || ""}
                  required
                />
              </label>
              <label className="caa">
                Tiền cọc mặc định:
                <input
                  type="number"
                  name="tien_coc_mac_dinh"
                  className="caa"
                  defaultValue={editItem?.tien_coc_mac_dinh || ""}
                  required
                />
              </label>
              <label className="caa">
                Phí phạt cơ bản:
                <input
                  type="number"
                  name="phi_phat_co_ban"
                  className="caa"
                  defaultValue={editItem?.phi_phat_co_ban || ""}
                  required
                />
              </label>
              <label className="caa">
                Tỷ lệ giảm:
                <input
                  type="number"
                  step="0.01"
                  name="ty_le_giam"
                  className="caa"
                  defaultValue={editItem?.ty_le_giam ?? ""}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setIsModalOpen(false)}
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
            <h2>Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa không?</p>
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy
              </button>
              <button className="btn btn-delete" onClick={confirmDelete}>
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

export default ChinhSachGiaList;
