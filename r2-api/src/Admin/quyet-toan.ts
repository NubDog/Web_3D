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

export const handleFinalizeOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const body = await request.json<{ phi_hu_hong?: number, phi_tre?: number, chi_phi_khac?: number, ghi_chu_quyet_toan?: string, nhan_vien_id: number }>();
        const don_thue_id = parseInt(orderId, 10);

        const orderStmt = env.DB.prepare("SELECT * FROM DonThue WHERE don_thue_id = ? AND trang_thai = 'DA_TRA'");
        const orderInfo = await orderStmt.bind(don_thue_id).first();
        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Đơn thuê không hợp lệ hoặc chưa ở trạng thái 'Đã Trả'." }, 404);
        }

        const depositStmt = env.DB.prepare("SELECT * FROM TienCoc WHERE don_thue_id = ?");
        const depositInfo = await depositStmt.bind(don_thue_id).first<{ so_tien: number }>();
        if (!depositInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy thông tin tiền cọc." }, 404);
        }

        const { phi_hu_hong = 0, phi_tre = 0, chi_phi_khac = 0, ghi_chu_quyet_toan, nhan_vien_id } = body;
        const totalFines = phi_hu_hong + phi_tre + chi_phi_khac;

        const depositAmount = depositInfo.so_tien;
        let moneyToRefund = 0;
        let moneyToCharge = 0;

        if (totalFines >= depositAmount) {
            moneyToCharge = totalFines - depositAmount;
            moneyToRefund = 0;
        } else {
            moneyToCharge = 0;
            moneyToRefund = depositAmount - totalFines;
        }

        const statements = [];
        if (phi_hu_hong > 0) {
            statements.push(env.DB.prepare("INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, trang_thai) VALUES (?, ?, 'PHI_HU_HONG', 'DA_THANH_TOAN')").bind(don_thue_id, phi_hu_hong));
        }
        if (phi_tre > 0) {
            statements.push(env.DB.prepare("INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, trang_thai) VALUES (?, ?, 'PHI_TRE', 'DA_THANH_TOAN')").bind(don_thue_id, phi_tre));
        }
        if (chi_phi_khac > 0) {
            statements.push(env.DB.prepare("INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, trang_thai) VALUES (?, ?, 'KHAC', 'DA_THANH_TOAN')").bind(don_thue_id, chi_phi_khac));
        }

        statements.push(env.DB.prepare("UPDATE TienCoc SET trang_thai = 'DA_HOAN', so_tien = ?, ghi_chu = ? WHERE don_thue_id = ?").bind(moneyToRefund, `Hoàn lại ${moneyToRefund} sau khi trừ các chi phí.`, don_thue_id));
        
        statements.push(env.DB.prepare("UPDATE DonThue SET trang_thai = 'HOAN_TAT', ghi_chu = ? WHERE don_thue_id = ?").bind(ghi_chu_quyet_toan, don_thue_id));

        await env.DB.batch(statements);

        if (moneyToCharge > 0) {
            await env.DB.prepare("INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, trang_thai) VALUES (?, ?, 'PHU_THU', 'CHO_THANH_TOAN')").bind(don_thue_id, moneyToCharge).run();
        }

        return jsonResponse({
            success: true,
            message: "Quyết toán đơn thuê thành công!",
            data: {
                tien_hoan_lai_tu_coc: moneyToRefund,
                tien_khach_phai_tra_them: moneyToCharge,
            }
        });

    } catch (e: any) {
        console.error("API Error in handleFinalizeOrder:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};