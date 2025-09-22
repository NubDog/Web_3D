import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
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
}

const ViolationList: React.FC = () => {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const fetchViolations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8787/api/violations');
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
    }, []);

    useEffect(() => {
        fetchViolations();
    }, [fetchViolations]);

    const handleAddViolation = async (data: any) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://127.0.0.1:8787/api/violations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
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
    
    if (isLoading) return <div className="admin-container"><p>Đang tải...</p></div>;

    return (
        <>
        <div className="admin-container">
            <h1>Quản lý Vi phạm</h1>
            <div className="action-bar">
                <button className="button-primary" onClick={() => setIsModalOpen(true)}>
                        + Ghi Nhận Vi Phạm
                </button>
            </div>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Xe Vi Phạm</th>
                            <th>Khách Hàng</th>
                            <th>Loại Vi Phạm</th>
                            <th className="align-right">Tiền Phạt</th>
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
                                <td className="align-right">{new Intl.NumberFormat('vi-VN').format(v.so_tien_phat || 0)} VND</td>
                                <td><span className={`status-badge`}>{v.trang_thai}</span></td>
                                <td>
                                    <button className="btn-edit">Sửa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
         <ViolationFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddViolation}
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default ViolationList;