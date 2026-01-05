import React, { useState, useEffect, useCallback} from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './../css/admin-violation.css';
import ViolationFormModal from '../Component-Admin/ViolationFormModal';

interface Violation {
  vi_pham_id: number;
  don_thue_id: number;
  ten_phuong_tien: string;
  bien_so: string;
  ten_khach_hang: string;
  loai_vi_pham: string;
  so_tien_phat: number;
  trang_thai: string;
  thoi_gian_xay_ra: string;
  co_quan_xu_ly: string | null;
  duong_dan_bang_chung: string | null;
}

const ViolationList: React.FC = () => {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingViolation, setEditingViolation] = useState<Violation | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');


    const fetchViolations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/violations?status=${filterStatus}`);
            const result = await response.json();
            if (result.success) {
                setViolations(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchViolations();
    }, [fetchViolations]);

    const handleAddViolation = async (data: any) => {
        setIsSubmitting(true);
         console.log("Dữ liệu gửi lên server:", data);

          const submissionData = new FormData();
        for (const key in data) {
            if (data[key]) {
                submissionData.append(key, data[key]);
            }
        }
        try {
        const response = await fetch('https://r2-api.sharkeatrice.workers.dev/api/violations', {
            method: 'POST',
            body: submissionData, // Gửi FormData
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        toast.success("Ghi nhận vi phạm thành công!");
        setIsModalOpen(false);
        fetchViolations(); 
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteViolation = async (violationId: number) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa vi phạm #${violationId}?`)) {
            return;
        }

        try {
            const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/violations/${violationId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            toast.warn("Đã xóa vi phạm.");
            fetchViolations(); 
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleOpenAddModal = () => {
        setEditingViolation(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (violation: Violation) => {
        setEditingViolation(violation); 
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingViolation(null);
    };

    const handleUpdateViolation = async (data: any) => {
        if (!editingViolation) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`https://r2-api.sharkeatrice.workers.dev/api/violations/${editingViolation.vi_pham_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success("Cập nhật vi phạm thành công!");
            handleCloseModal();
            fetchViolations();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) return <div className="admin-container"><p>Đang tải...</p></div>;

    return (
        <>
        <div className="admin-container">
            <h1>Quản lý Vi phạm</h1>
            <div className="action-bar">
                <button className="button-primary" onClick={handleOpenAddModal}>
                    + Ghi Nhận Vi Phạm
                </button>
                <div className="filter-buttons">
                    <button onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? 'active' : ''}>Tất cả</button>
                    <button onClick={() => setFilterStatus('chua_xu_ly')} className={filterStatus === 'chua_xu_ly' ? 'active' : ''}>Chưa xử lý</button>
                    <button onClick={() => setFilterStatus('da_thanh_toan')} className={filterStatus === 'da_thanh_toan' ? 'active' : ''}>Đã thanh toán</button>
                    <button onClick={() => setFilterStatus('huy_bo')} className={filterStatus === 'huy_bo' ? 'active' : ''}>Đã hủy</button>
                </div>
            </div>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Xe Vi Phạm</th>
                            <th>Khách Hàng</th>
                            <th>Loại Vi Phạm</th>
                            <th>Cơ quan xử lý</th>
                            <th className="align-right">Tiền Phạt</th>
                            <th>Bằng chứng</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {violations.map(v => (
                            <tr key={v.vi_pham_id}>
                                <td>#{v.vi_pham_id}</td>
                                <td>{v.ten_phuong_tien} ({v.bien_so})</td>
                                <td>{v.ten_khach_hang}</td>
                                <td>{v.loai_vi_pham}</td>
                                <td>{v.co_quan_xu_ly || 'Chưa cập nhật'}</td>
                                <td className="align-right">{new Intl.NumberFormat('vi-VN').format(v.so_tien_phat || 0)} VND</td>
                                <td>
                                    {v.duong_dan_bang_chung ? (
                                        <a href={v.duong_dan_bang_chung} target="_blank" rel="noopener noreferrer" className='text1'>
                                            Xem ảnh
                                        </a>
                                    ) : (
                                        'Không có'
                                    )}
                                </td>
                                <td><span className={`status-badge`}>{v.trang_thai}</span></td>
                                <td>
                                     <button className="btn-edit" onClick={() => handleOpenEditModal(v)}>Sửa</button>
                                     <button className="btn-delete" onClick={() => handleDeleteViolation(v.vi_pham_id)}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
       
         <ViolationFormModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={editingViolation ? handleUpdateViolation : handleAddViolation}
                isSubmitting={isSubmitting}
                initialData={editingViolation}
            />
        </>
    );
};

export default ViolationList;