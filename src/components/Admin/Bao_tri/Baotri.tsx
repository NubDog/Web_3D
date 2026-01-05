// code của thành
import React, { useEffect, useState } from "react";
import "./Baotrilist.css";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router-dom";
interface BaoTriTongHop {
  phuong_tien_id: number;
  ten_phuong_tien: string;
  tong_so_bao_tri: number;
  tong_chi_phi: number;
  ngay_tao_moi_nhat: string;
}

interface BaoTriChiTiet {
  bao_tri_id: number;
  phuong_tien_id: number;
  don_thue_id_lien_quan: number;
  ngay_lich: string;
  mo_ta: string;
  chi_phi: number;
  trang_thai: string;
  nhan_vien_tao: number;
  ngay_tao: string;
  ngay_cap_nhat: string;
  ten_nguoi_tao: string;
}

interface PhuongTien {
  phuong_tien_id: number;
  ten_phuong_tien: string;
  bien_so: string;
}

interface DonThue {
  don_thue_id: number;
  phuong_tien_id: number;
  ten_khach_hang: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
}

const BaoTriList: React.FC = () => {
  const [data, setData] = useState<BaoTriTongHop[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [chiTiet, setChiTiet] = useState<Record<number, BaoTriChiTiet[]>>({});

  // modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // user từ context
  const { currentUser } = useAuth();

  // form thêm
  const [formAdd, setFormAdd] = useState<any>({
    phuong_tien_id: 0,
    don_thue_id_lien_quan: 0,
    mo_ta: "",
    chi_phi: "",
    trang_thai: "CHO_DUYET",
    nhan_vien_tao: currentUser?.nguoi_dung_id || 0,
  });

  // form sửa
  const [formEdit, setFormEdit] = useState<any>({
    bao_tri_id: 0,
    mo_ta: "",
    chi_phi: "",
    trang_thai: "CHO_DUYET",
  });

  const [phuongTienList, setPhuongTienList] = useState<PhuongTien[]>([]);
  const [donThueList, setDonThueList] = useState<DonThue[]>([]);

  const API_URL = "https://r2-api.sharkeatrice.workers.dev";

  useEffect(() => {
    fetchTongHop();
    fetch(`${API_URL}/Admin/phuong-tien`)
      .then((res) => res.json())
      .then((json) => json.success && setPhuongTienList(json.data));
  }, []);

  // cập nhật nhan_vien_tao khi user thay đổi (sau khi login)
  useEffect(() => {
    if (currentUser?.nguoi_dung_id) {
      setFormAdd((prev: any) => ({
        ...prev,
        nhan_vien_tao: currentUser.nguoi_dung_id,
      }));
    }
  }, [currentUser]);

  const fetchTongHop = () => {
    fetch(`${API_URL}/api/baotri/tonghop`)
      .then((res) => res.json())
      .then((json) => json.success && setData(json.data));
  };

  const fetchChiTiet = async (phuongTienId: number) => {
    const res = await fetch(`${API_URL}/api/baotri/chitiet/${phuongTienId}`);
    const json = await res.json();
    if (json.success) {
      setChiTiet((prev) => ({ ...prev, [phuongTienId]: json.data }));
      setExpanded(phuongTienId);
    }
  };

  // mở modal thêm
  const openAddModal = () => {
    setFormAdd({
      phuong_tien_id: 0,
      don_thue_id_lien_quan: 0,
      mo_ta: "",
      chi_phi: "",
      trang_thai: "CHO_DUYET",
      nhan_vien_tao: currentUser?.nguoi_dung_id || 0,
    });
    setDonThueList([]);
    setShowAddModal(true);
  };

  // khi chọn phương tiện → load đơn thuê liên quan
  const handleChangePhuongTien = async (id: number) => {
    setFormAdd({
      ...formAdd,
      phuong_tien_id: id,
      don_thue_id_lien_quan: 0,
    });

    if (id > 0) {
      const res = await fetch(`${API_URL}/Admin/don-thue?phuong_tien_id=${id}`);
      const json = await res.json();
      if (json.success) {
        setDonThueList(json.data);
      } else {
        setDonThueList([]);
      }
    } else {
      setDonThueList([]);
    }
  };

  // thêm
  const handleAdd = async () => {
    if (!formAdd.phuong_tien_id) {
      alert("Vui lòng chọn phương tiện");
      return;
    }
    if (!formAdd.don_thue_id_lien_quan) {
      alert("Vui lòng chọn đơn thuê liên quan");
      return;
    }
    if (!formAdd.mo_ta.trim()) {
      alert("Vui lòng nhập mô tả");
      return;
    }
    if (!formAdd.chi_phi || parseFloat(formAdd.chi_phi) <= 0) {
      alert("Vui lòng nhập chi phí hợp lệ");
      return;
    }

    const payload = {
      phuong_tien_id: formAdd.phuong_tien_id,
      don_thue_id_lien_quan: formAdd.don_thue_id_lien_quan,
      mo_ta: formAdd.mo_ta.trim(),
      chi_phi: parseFloat(formAdd.chi_phi),
      trang_thai: "CHO_DUYET",
      nhan_vien_tao: currentUser?.nguoi_dung_id || 0,
    };

    try {
      const res = await fetch(`${API_URL}/api/baotri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        alert("Lỗi khi thêm: " + (json.error || "Không rõ"));
        return;
      }

      alert("Thêm bảo trì thành công ✅");
      setShowAddModal(false);
      fetchTongHop();
      if (expanded) fetchChiTiet(expanded);
    } catch (error: any) {
      alert("Lỗi khi thêm: " + error.message);
    }
  };

  // sửa
  const handleEdit = async () => {
    const payload = {
      mo_ta: formEdit.mo_ta,
      chi_phi: parseFloat(formEdit.chi_phi),
      trang_thai: formEdit.trang_thai,
    };

    const res = await fetch(`${API_URL}/api/baotri/${formEdit.bao_tri_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.success) {
      alert("Lỗi khi cập nhật: " + (json.error || "Không rõ"));
      return;
    }

    setShowEditModal(false);
    fetchTongHop();
    if (expanded) fetchChiTiet(expanded);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa không?")) return;
    const res = await fetch(`${API_URL}/api/baotri/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) {
      alert("Lỗi khi xóa: " + (json.error || "Không rõ"));
      return;
    }
    fetchTongHop();
    if (expanded) fetchChiTiet(expanded);
  };

  return (
    <div className="bao-tri-container">
      <div className="bao-tri-header">
        <h2 className="Text">Danh sách Bảo Trì</h2>
        <button className="bao-tri-add" onClick={openAddModal}>
          + Thêm bảo trì
        </button>
      </div>

      {data.length === 0 ? (
        <p className="bao-tri-empty">Không có dữ liệu bảo trì</p>
      ) : (
        <table className="bao-tri-table">
          <thead>
            <tr>
              <th>Tên phương tiện</th>
              <th>Số lần bảo trì</th>
              <th>Tổng chi phí</th>
              <th>Ngày tạo mới nhất</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <React.Fragment key={row.phuong_tien_id}>
                <tr>
                  <td>{row.ten_phuong_tien}</td>
                  <td>{row.tong_so_bao_tri}</td>
                  <td>{row.tong_chi_phi.toLocaleString("vi-VN")} đ</td>
                  <td>{row.ngay_tao_moi_nhat}</td>
                  <td>
                    <button
                      onClick={() => fetchChiTiet(row.phuong_tien_id)}
                      className="bao-tri-button"
                    >
                      {expanded === row.phuong_tien_id ? "Ẩn" : "Chi tiết"}
                    </button>
                  </td>
                </tr>

                {expanded === row.phuong_tien_id &&
                  chiTiet[row.phuong_tien_id] && (
                    <tr>
                      <td colSpan={6} className="bao-tri-details">
                        <h4>Chi tiết bảo trì</h4>
                        <table className="bao-tri-subtable">
                          <thead>
                            <tr>
                              <th>STT</th>
                              <th>Mô tả</th>
                              <th>Chi phí</th>

                              <th>Người tạo</th>
                              <th>Ngày tạo</th>
                              <th>Ngày cập nhật</th>
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chiTiet[row.phuong_tien_id].map((ct, index) => (
                              <tr key={ct.bao_tri_id}>
                                <td>{index + 1}</td>
                                <td>{ct.mo_ta}</td>
                                <td>{ct.chi_phi.toLocaleString("vi-VN")} đ</td>

                                <td>{ct.ten_nguoi_tao}</td>
                                <td>{ct.ngay_tao}</td>
                                <td>{ct.ngay_cap_nhat}</td>

                                <td>
                                  <Link
                                    to={`/admin/bao_tri/chitiet/${ct.bao_tri_id}`}
                                    className="bao-tri-chitiet"
                                  >
                                    Xem chi tiết
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal thêm */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="Text">Thêm bảo trì</h3>

            <label className="Text">Phương tiện</label>
            <select
              className="Text"
              value={formAdd.phuong_tien_id}
              onChange={(e) => handleChangePhuongTien(Number(e.target.value))}
            >
              <option value={0}>-- Chọn phương tiện --</option>
              {phuongTienList.map((pt) => (
                <option key={pt.phuong_tien_id} value={pt.phuong_tien_id}>
                  {pt.ten_phuong_tien} ({pt.bien_so})
                </option>
              ))}
            </select>

            <label className="Text">Đơn thuê liên quan</label>
            <select
              className="Text"
              value={formAdd.don_thue_id_lien_quan || ""}
              onChange={(e) =>
                setFormAdd({
                  ...formAdd,
                  don_thue_id_lien_quan: Number(e.target.value) || 0,
                })
              }
              disabled={donThueList.length === 0}
            >
              <option value={0}>-- Chọn đơn thuê --</option>
              {donThueList.map((dt) => (
                <option key={dt.don_thue_id} value={dt.don_thue_id}>
                  #{dt.don_thue_id} - {dt.ten_khach_hang} ({dt.ngay_bat_dau} →{" "}
                  {dt.ngay_ket_thuc})
                </option>
              ))}
            </select>

            <label className="Text">Mô tả</label>
            <input
              className="Text"
              type="text"
              value={formAdd.mo_ta}
              onChange={(e) =>
                setFormAdd({ ...formAdd, mo_ta: e.target.value })
              }
            />

            <label className="Text">Chi phí</label>
            <input
              className="Text"
              type="number"
              value={formAdd.chi_phi}
              onChange={(e) =>
                setFormAdd({ ...formAdd, chi_phi: e.target.value })
              }
            />

            <div className="modal-actions">
              <button onClick={handleAdd} className="bao-tri-save">
                Lưu
              </button>
              <button onClick={() => setShowAddModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaoTriList;
