const jsonResponse = (data: any, status = 200) => {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	return new Response(JSON.stringify(data), { status, headers });
};

interface Env {
    DB: D1Database;
}

interface RentalRequestBody {
    khach_hang_id: number;
    phuong_tien_id: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    dia_diem_nhan: string;
    dia_diem_tra: string;
}

//Tạo đơn (cho Người dùng)
export const handleCreateRentalOrder = async (request: Request, env: Env) => {
    try {
        const body: RentalRequestBody = await request.json();

        const { khach_hang_id, phuong_tien_id, ngay_bat_dau, ngay_ket_thuc, dia_diem_nhan, dia_diem_tra } = body;
        if (!khach_hang_id || !phuong_tien_id || !ngay_bat_dau || !ngay_ket_thuc) {
            return jsonResponse({ success: false, error: "Thiếu thông tin bắt buộc." }, 400);
        }

        const startDate = new Date(ngay_bat_dau);
        const endDate = new Date(ngay_ket_thuc);

        if (startDate >= endDate) {
            return jsonResponse({ success: false, error: "Ngày kết thúc phải sau ngày bắt đầu." }, 400);
        }


        const CheckBlock = env.DB.prepare(
            `SELECT trang_thai from NguoiDung where nguoi_dung_id = ?`
        )
        const getStatus = await CheckBlock.bind(khach_hang_id).first<{trang_thai:string}>()

        if(getStatus?.trang_thai === 'inactive'){
            return jsonResponse({ success: false, error: "Người dùng đã bị khóa." }, 410); 
        }

        const vehicleStmt = env.DB.prepare(
            `SELECT pt.trang_thai, pt.chinh_sach_id, cs.gia_co_ban, cs.tien_coc_mac_dinh 
             FROM PhuongTien AS pt
             JOIN ChinhSachGia AS cs ON pt.chinh_sach_id = cs.chinh_sach_id
             WHERE pt.phuong_tien_id = ?`
        );
        const vehicleInfo = await vehicleStmt.bind(phuong_tien_id).first<{ trang_thai: string, chinh_sach_id: number, gia_co_ban: number, tien_coc_mac_dinh: number }>();

        if (!vehicleInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy phương tiện." }, 404);
        }
        if (vehicleInfo.trang_thai !== 'Hoạt động' && vehicleInfo.trang_thai !== 'SAN_SANG') {
            return jsonResponse({ success: false, error: "Phương tiện không sẵn sàng để cho thuê." }, 409); 
        }

        const conflictStmt = env.DB.prepare(
           `SELECT don_thue_id FROM DonThue
            WHERE phuong_tien_id = ? 
            AND trang_thai IN ('DA_DUYET', 'DANG_THUE')
            AND (
                (ngay_bat_dau < ? AND ngay_ket_thuc > ?)
            )`
        );
        const conflictingOrder = await conflictStmt.bind(phuong_tien_id, ngay_ket_thuc, ngay_bat_dau).first();

        if (conflictingOrder) {
            return jsonResponse({ success: false, error: "Phương tiện đã được đặt trong khoảng thời gian này." }, 409);
        }

        const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const tong_tien = rentalDays * vehicleInfo.gia_co_ban;
        const tien_coc_yeu_cau = vehicleInfo.tien_coc_mac_dinh;

        const insertOrderStmt = env.DB.prepare(
            `INSERT INTO DonThue (khach_hang_id, phuong_tien_id, ngay_bat_dau, ngay_ket_thuc, dia_diem_nhan, dia_diem_tra, trang_thai, chinh_sach_id, tong_tien, tien_coc_yeu_cau, ngay_tao, ngay_cap_nhat)
             VALUES (?, ?, ?, ?, ?, ?, 'CHO_DUYET', ?, ?, ?, datetime('now', '+7 hours'), datetime('now', '+7 hours'))`
        );
        const updateVehicleStmt = env.DB.prepare(
            `UPDATE PhuongTien SET trang_thai = 'DA_DAT' WHERE phuong_tien_id = ?`
        );

        const result = await env.DB.batch([
            insertOrderStmt.bind(khach_hang_id, phuong_tien_id, ngay_bat_dau, ngay_ket_thuc, dia_diem_nhan, dia_diem_tra, vehicleInfo.chinh_sach_id, tong_tien, tien_coc_yeu_cau),
            updateVehicleStmt.bind(phuong_tien_id)
        ]);
        
        return jsonResponse({
            success: true,
            message: `Yêu cầu thuê xe đã được gửi thành công!`,
            data: {
                trang_thai: "CHO_DUYET",
                tong_tien_du_kien: tong_tien,
                tien_coc_yeu_cau: tien_coc_yeu_cau
            }
        });

    } catch (e: any) {
        console.error("API handleCreateRentalOrder lỗi:", e);
        return jsonResponse({ success: false, error: e.message || "Internal Server Error" }, 500);
    }
};

//DS chờ duyệt
export const handleGetPendingOrders = async (request: Request, env: Env) => {
    try {
        const stmt = env.DB.prepare(
            `SELECT 
                dt.don_thue_id, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc, 
                dt.tong_tien, kh.ho_ten, pt.ten_phuong_tien
             FROM DonThue AS dt
             JOIN KhachHang AS kh ON dt.khach_hang_id = kh.khach_hang_id
             JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
             WHERE dt.trang_thai = 'CHO_DUYET'
             ORDER BY dt.ngay_tao DESC`
        );
        const { results } = await stmt.all();
        return jsonResponse({ success: true, data: results });

    } catch (e: any) {
        console.error("API handleGetPendingOrders lỗi:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//Duyệt đơn
export const handleApproveOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id } = await request.json<{ nhan_vien_id: number }>();
        if (!nhan_vien_id) {
            return jsonResponse({ success: false, error: "Thiếu ID nhân viên." }, 400);
        }

        const orderInfo = await env.DB.prepare("SELECT * FROM DonThue WHERE don_thue_id = ? AND trang_thai = 'CHO_DUYET'").bind(orderId).first<{ don_thue_id: number, khach_hang_id:number, tong_tien: number, tien_coc_yeu_cau: number }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Đơn thuê không hợp lệ hoặc đã được xử lý." }, 404);
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const so_hop_dong = `HD-${year}${month}${day}-${orderId}`;

        const approveOrderStmt = env.DB.prepare(
            "UPDATE DonThue SET trang_thai = 'DA_DUYET', nhan_vien_tao = ? WHERE don_thue_id = ?"
        );
        const createContractStmt = env.DB.prepare(
            "INSERT INTO HopDong (don_thue_id, so_hop_dong, ngay_ky, nhan_vien_ky, khach_hang_ky, trang_thai) VALUES (?, ?, datetime('now','+7 hours'), ?,?, 'CHO_KY')"
        );
        const createDepositStmt = env.DB.prepare(
            "INSERT INTO TienCoc (don_thue_id, so_tien, trang_thai) VALUES (?, ?, 'DANG_GIU')"
        );
        const createPaymentStmt = env.DB.prepare(
            "INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, trang_thai) VALUES (?, ?, 'PHI_THUE', 'CHO_THANH_TOAN')"
        );

        await env.DB.batch([
            approveOrderStmt.bind(nhan_vien_id, orderId),
            createContractStmt.bind(orderId, so_hop_dong, nhan_vien_id, orderInfo.khach_hang_id ), 
            createDepositStmt.bind(orderId, orderInfo.tien_coc_yeu_cau),
            createPaymentStmt.bind(orderId, orderInfo.tong_tien),
        ]);

        return jsonResponse({ success: true, message: `Đã duyệt đơn thuê #${orderId}` });

    } catch (e: any) {
        console.error("API handleApproveOrder Lỗi:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//Từ chối đơn
export const handleRejectOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id, ly_do } = await request.json<{ nhan_vien_id: number, ly_do?: string }>();
        if (!nhan_vien_id) {
            return jsonResponse({ success: false, error: "Thiếu ID nhân viên." }, 400);
        }

        const orderInfo = await env.DB.prepare(
            "SELECT phuong_tien_id FROM DonThue WHERE don_thue_id = ? AND trang_thai = 'CHO_DUYET'"
        ).bind(orderId).first<{ phuong_tien_id: number }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Đơn thuê không hợp lệ hoặc đã được xử lý." }, 404);
        }

        const rejectOrderStmt = env.DB.prepare(
            "UPDATE DonThue SET trang_thai = 'TU_CHOI', ghi_chu = ? WHERE don_thue_id = ?"
        );
        const releaseVehicleStmt = env.DB.prepare(
            "UPDATE PhuongTien SET trang_thai = 'SAN_SANG' WHERE phuong_tien_id = ?"
        );

        await env.DB.batch([
            rejectOrderStmt.bind(ly_do || 'Không có lý do', orderId),
            releaseVehicleStmt.bind(orderInfo.phuong_tien_id),
        ]);

        return jsonResponse({ success: true, message: `Đã từ chối đơn thuê #${orderId}` });

    } catch (e: any) {
        console.error("API handleRejectOrder lỗi :", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//hàm gọi chi tiết đơn thuê
export const handleGetOrderDetails = async (request: Request, env: Env, orderId: string) => {
    try {
        const stmt = env.DB.prepare(
            `SELECT 
                dt.*, 
                nd.ho_ten, nd.email, 
                pt.ten_phuong_tien, pt.bien_so,
                cs.ten_chinh_sach
             FROM DonThue AS dt
             JOIN Nguoidung AS nd ON dt.khach_hang_id = nd.nguoi_dung_id
             JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
             JOIN ChinhSachGia AS cs ON dt.chinh_sach_id = cs.chinh_sach_id
             WHERE dt.don_thue_id = ?`
        );
        const orderDetails = await stmt.bind(orderId).first();

        if (!orderDetails) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn thuê." }, 404);
        }

        return jsonResponse({ success: true, data: orderDetails });

    } catch (e: any) {
        console.error("API Error in handleGetOrderDetails:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

export const handleGetOrders = async (request: Request, env: Env) => {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status'); // Lấy status từ query param

        const baseQuery = `
            SELECT 
                dt.don_thue_id, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc, 
                dt.tong_tien, dt.trang_thai, kh.ho_ten, pt.ten_phuong_tien
            FROM DonThue AS dt
            JOIN NguoiDung AS kh ON dt.khach_hang_id = kh.nguoi_dung_id
            JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
        `;

        let finalQuery = baseQuery;
        const params = [];

        // Nếu có status được truyền vào thì thêm điều kiện WHERE
        if (status) {
            const statusMap: { [key: string]: string } = {
                pending: 'CHO_DUYET',
                approved: 'DA_DUYET',
                active: 'DANG_THUE',
                returned: 'DA_TRA',
                completed: 'HOAN_TAT',
                cancelled: 'TU_CHOI'
            };
            const dbStatus = statusMap[status];

            if (!dbStatus) {
                return jsonResponse({ success: false, error: "Trạng thái không hợp lệ." }, 400);
            }
            finalQuery += ` WHERE dt.trang_thai = ?`;
            params.push(dbStatus);
        }

        finalQuery += ` ORDER BY dt.ngay_tao DESC`;

        const stmt = env.DB.prepare(finalQuery).bind(...params);
        const { results } = await stmt.all();
        
        return jsonResponse({ success: true, data: results });

    } catch (e: any) {
        console.error("API Error in handleGetOrders:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};