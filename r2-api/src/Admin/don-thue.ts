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
            `SELECT pt.trang_thai, pt.chinh_sach_id, pt.gia_thue, cs.tien_coc_mac_dinh 
             FROM PhuongTien AS pt
             JOIN ChinhSachGia AS cs ON pt.chinh_sach_id = cs.chinh_sach_id
             WHERE pt.phuong_tien_id = ?`
        );
        const vehicleInfo = await vehicleStmt.bind(phuong_tien_id).first<{ trang_thai: string, chinh_sach_id: number, gia_thue: number, tien_coc_mac_dinh: number }>();

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
        const tong_tien = rentalDays * vehicleInfo.gia_thue;
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
            "INSERT INTO TienCoc (don_thue_id, so_tien, trang_thai) VALUES (?, ?, 'CHO_THANH_TOAN')"
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

//Từ chối đơn (nhân viên / admin hủy trực tiếp)
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

// hủy đơn (sau khi duyệt đơn) - nv sẽ hủy đơn thay cho khách hàng
export const handleCancelOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id, ly_do_huy } = await request.json<{ nhan_vien_id: number, ly_do_huy: string }>();

        if (!nhan_vien_id || !ly_do_huy) {
            return jsonResponse({ success: false, error: "Thiếu ID nhân viên hoặc lý do hủy." }, 400);
        }

        const orderStmt = env.DB.prepare(
            `SELECT trang_thai, phuong_tien_id FROM DonThue WHERE don_thue_id = ?`
        );
        const orderInfo = await orderStmt.bind(orderId).first<{ trang_thai: string, phuong_tien_id: number }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn thuê." }, 404);
        }

        if (orderInfo.trang_thai !== 'DA_DUYET') {
            return jsonResponse({ success: false, error: `Không thể hủy đơn hàng ở trạng thái "${orderInfo.trang_thai}".` }, 409);
        }

        const cancelOrderStmt = env.DB.prepare(
            `UPDATE DonThue SET trang_thai = 'TU_CHOI', ghi_chu = ? WHERE don_thue_id = ?`
        );
        
        const releaseVehicleStmt = env.DB.prepare(
            `UPDATE PhuongTien SET trang_thai = 'SAN_SANG' WHERE phuong_tien_id = ?`
        );

        await env.DB.batch([
            cancelOrderStmt.bind(`Đơn đã bị hủy bởi nhân viên. Lý do: ${ly_do_huy}`, orderId),
            releaseVehicleStmt.bind(orderInfo.phuong_tien_id)
        ]);

        return jsonResponse({ success: true, message: "Hủy đơn hàng thành công." });
    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//hàm gọi chi tiết đơn thuê
export const handleGetOrderDetails = async (request: Request, env: Env, orderId: string) => {
    try {
         const stmt = env.DB.prepare(
            `SELECT 
                dt.*, 
                kh.ho_ten, kh.email, 
                pt.ten_phuong_tien, pt.bien_so, pt.gia_thue,
                cs.ten_chinh_sach, cs.ty_le_giam, cs.tien_coc_mac_dinh,
                tc.trang_thai AS trang_thai_coc,

                bbgn_giao.so_km AS giao_so_km,
                bbgn_giao.muc_xang AS giao_muc_xang,
                bbgn_giao.ghi_chu_hu_hong AS giao_ghi_chu,
                bbgn_giao.duong_dan_anh AS giao_anh,

                bbgn_tra.so_km AS tra_so_km,
                bbgn_tra.muc_xang AS tra_muc_xang,
                bbgn_tra.ghi_chu_hu_hong AS tra_ghi_chu,
                bbgn_tra.duong_dan_anh AS tra_anh

              FROM DonThue AS dt
            JOIN NguoiDung AS kh ON dt.khach_hang_id = kh.nguoi_dung_id
            JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
            JOIN ChinhSachGia AS cs ON dt.chinh_sach_id = cs.chinh_sach_id
            LEFT JOIN TienCoc AS tc ON dt.don_thue_id = tc.don_thue_id
            
            -- JOIN lấy thông tin bàn giao
            LEFT JOIN BienBanGiaoNhan AS bbgn_giao ON dt.don_thue_id = bbgn_giao.don_thue_id AND bbgn_giao.loai_bien_ban = 'GIAO_XE'
            
            -- JOIN lấy thông tin trả xe
            LEFT JOIN BienBanGiaoNhan AS bbgn_tra ON dt.don_thue_id = bbgn_tra.don_thue_id AND bbgn_tra.loai_bien_ban = 'TRA_XE'

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
        const status = url.searchParams.get('status'); 

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