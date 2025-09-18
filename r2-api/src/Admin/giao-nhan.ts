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
    ICC: R2Bucket; 
}

//bàn giao phương tiện (Nhân viên)
export const handleVehicleHandover = async (request: Request, env: Env, orderId: string) => {
    try {
        const formData = await request.formData();
        const don_thue_id = parseInt(orderId, 10);

        const so_km = parseInt(formData.get('so_km') as string, 10);
        const muc_xang = formData.get('muc_xang') as string;
        const ghi_chu_hu_hong = formData.get('ghi_chu_hu_hong') as string;
        const anh_minh_chung_files = formData.getAll('anh_minh_chung') as File[];

        if (isNaN(so_km) || !muc_xang) {
            return jsonResponse({ success: false, error: "Thiếu thông tin số km hoặc mức xăng." }, 400);
        }

        const orderStmt = env.DB.prepare(`SELECT * FROM DonThue WHERE don_thue_id = ?`);
        const currentOrder = await orderStmt.bind(don_thue_id).first<{ trang_thai: string, phuong_tien_id: number, nhan_vien_tao: number, khach_hang_id: number }>();

        if (!currentOrder) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn thuê." }, 404);
        }
        if (currentOrder.trang_thai !== 'DA_DUYET') {
            return jsonResponse({ success: false, error: "Chỉ có thể bàn giao xe cho đơn đã được duyệt." }, 409);
        }

        const imageUrls = [];
        for (const file of anh_minh_chung_files) {
            if (file.size > 0) {
                 const key = `bien-ban/${don_thue_id}/giao-xe/${Date.now()}-${file.name}`;
                 await env.ICC.put(key, await file.arrayBuffer(), {
                     httpMetadata: { contentType: file.type },
                 });
                 const publicUrl = `https://pub-ce524c55279d4538986c44bbd4a385bd.r2.dev/${key}`; 
                 imageUrls.push(publicUrl);
            }
        }

        const insertBienBanStmt = env.DB.prepare(
            `INSERT INTO BienBanGiaoNhan (don_thue_id, loai_bien_ban, thoi_gian, so_km, muc_xang, ghi_chu_hu_hong, duong_dan_anh, khach_hang_ky, nhan_vien_ky)
             VALUES (?, 'GIAO_XE', datetime('now','+7 hours'), ?, ?, ?, ?, ?, ?)`
        );
        const startOrderStmt = env.DB.prepare(
            `UPDATE DonThue SET trang_thai = 'DANG_THUE' WHERE don_thue_id = ?`
        );
        const updateVehicleStmt = env.DB.prepare(
            `UPDATE PhuongTien SET trang_thai = 'DANG_THUE', so_km = ? WHERE phuong_tien_id = ?`
        );

        await env.DB.batch([
            insertBienBanStmt.bind(don_thue_id, so_km, muc_xang, ghi_chu_hu_hong, JSON.stringify(imageUrls),currentOrder.khach_hang_id, currentOrder.nhan_vien_tao),
            startOrderStmt.bind(don_thue_id),
            updateVehicleStmt.bind(so_km, currentOrder.phuong_tien_id)
        ]);
        
        return jsonResponse({ success: true, message: "Bàn giao xe thành công, đơn thuê đã bắt đầu." });

    } catch (e: any) {
        console.error("API Error in handleVehicleHandover:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

// trả xe của Nhân viên
export const handleVehicleReturn = async (request: Request, env: Env, orderId: string) => {
    try {
        const formData = await request.formData();
        const don_thue_id = parseInt(orderId, 10);

        const so_km_tra = parseInt(formData.get('so_km_tra') as string, 10);
        const muc_xang_tra = formData.get('muc_xang_tra') as string;
        const ghi_chu_hu_hong_moi = formData.get('ghi_chu_hu_hong_moi') as string;
        const anh_files = formData.getAll('anh_minh_chung') as File[];

        const orderStmt = env.DB.prepare(`SELECT * FROM DonThue WHERE don_thue_id = ?`);
        const currentOrder = await orderStmt.bind(don_thue_id).first<{ trang_thai: string, phuong_tien_id: number, khach_hang_id:Number, nhan_vien_tao: number }>();

        if (!currentOrder) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn thuê." }, 404);
        }
        if (currentOrder.trang_thai !== 'DANG_THUE') {
            return jsonResponse({ success: false, error: "Không thể trả xe cho đơn không ở trạng thái 'ĐANG THUÊ'." }, 409);
        }

        const imageUrls = [];
        for (const file of anh_files) {
            if (file.size > 0) {
                const key = `bien-ban/${don_thue_id}/tra-xe/${Date.now()}-${file.name}`;
                await env.ICC.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
                const publicUrl = `https://pub-ce524c55279d4538986c44bbd4a385bd.r2.dev/${key}`; 
                imageUrls.push(publicUrl);
            }
        }
        
        const newVehicleStatus = ghi_chu_hu_hong_moi ? 'BAO_TRI' : 'SAN_SANG';

        const insertReturnRecordStmt = env.DB.prepare(
            `INSERT INTO BienBanGiaoNhan (don_thue_id, loai_bien_ban, thoi_gian, so_km, muc_xang, ghi_chu_hu_hong, duong_dan_anh, nhan_vien_ky, khach_hang_ky)
             VALUES (?, 'TRA_XE', datetime('now','+7 hours'), ?, ?, ?, ?, ?,?)`
        );
        const updateOrderStmt = env.DB.prepare(
            `UPDATE DonThue SET trang_thai = 'DA_TRA' WHERE don_thue_id = ?`
        );
        const updateVehicleStmt = env.DB.prepare(
            `UPDATE PhuongTien SET trang_thai = ?, so_km = ? WHERE phuong_tien_id = ?`
        );

        await env.DB.batch([
            insertReturnRecordStmt.bind(don_thue_id, so_km_tra, muc_xang_tra, ghi_chu_hu_hong_moi, JSON.stringify(imageUrls),currentOrder.nhan_vien_tao, currentOrder.khach_hang_id ),
            updateOrderStmt.bind(don_thue_id),
            updateVehicleStmt.bind(newVehicleStatus, so_km_tra, currentOrder.phuong_tien_id)
        ]);
        
        if (newVehicleStatus === 'BAO_TRI') {
            const createMaintenanceStmt = env.DB.prepare(
                `INSERT INTO BaoTri (phuong_tien_id, don_thue_id_lien_quan, mo_ta, trang_thai, nhan_vien_tao, ngay_lich) VALUES (?, ?, ?, 'MO',?, datetime('now','+7 hour'))`
            );
            await createMaintenanceStmt.bind(currentOrder.phuong_tien_id, don_thue_id, ghi_chu_hu_hong_moi, currentOrder.nhan_vien_tao).run();
        }

        return jsonResponse({ success: true, message: "Tiếp nhận xe trả thành công. Vui lòng tiến hành quyết toán." });

    } catch (e: any) {
        console.error("API Error in handleVehicleReturn:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};