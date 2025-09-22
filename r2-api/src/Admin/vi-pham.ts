const jsonResponse = (data: any, status = 200) => {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	return new Response(JSON.stringify(data), { status, headers });
};

export interface Env {
  DB: D1Database;
  RESEND_API_KEY:string;
}

// Lấy danh sách tất cả vi phạm
export const handleGetViolations = async (request: Request, env: Env) => {
    try {
        const stmt = env.DB.prepare(
            `SELECT 
                vp.*,
                pt.ten_phuong_tien,
                pt.bien_so,
                nd.ho_ten AS ten_khach_hang
             FROM ViPham AS vp
             JOIN DonThue AS dt ON vp.don_thue_id = dt.don_thue_id
             JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
             JOIN NguoiDung AS nd ON dt.khach_hang_id = nd.nguoi_dung_id
             ORDER BY vp.thoi_gian_xay_ra DESC`
        );
        const { results } = await stmt.all();
        return jsonResponse({ success: true, data: results });
    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

// Ghi nhận một vi phạm mới
export const handleCreateViolation = async (request: Request, env: Env) => {
    try {
        const body = await request.json<any>();
        const { don_thue_id, loai_vi_pham, so_tien_phat, thoi_gian_xay_ra, ghi_chu } = body;

        if (!don_thue_id || !loai_vi_pham || !thoi_gian_xay_ra) {
            return jsonResponse({ success: false, error: "Thiếu thông tin bắt buộc." }, 400);
        }

        const stmt = env.DB.prepare(
            `INSERT INTO ViPham (don_thue_id, loai_vi_pham, so_tien_phat, thoi_gian_xay_ra, ghi_chu, trang_thai)
             VALUES (?, ?, ?, ?, ?, 'CHO_XU_LY')`
        );
        await stmt.bind(don_thue_id, loai_vi_pham, so_tien_phat || 0, thoi_gian_xay_ra, ghi_chu || '').run();

        const infoStmt = env.DB.prepare(
            `SELECT nd.ho_ten, nd.email, pt.ten_phuong_tien, pt.bien_so
             FROM DonThue dt
             JOIN NguoiDung nd ON dt.khach_hang_id = nd.nguoi_dung_id
             JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
             WHERE dt.don_thue_id = ?`
        );
        const customerInfo = await infoStmt.bind(don_thue_id).first<{ ho_ten: string, email: string, ten_phuong_tien: string, bien_so: string }>();

        if (customerInfo && env.RESEND_API_KEY) {
            const emailBody = {
                from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                to: customerInfo.email,
                subject: `Thông báo về vi phạm giao thông cho đơn thuê #${don_thue_id}`,
                html: `
                    <h3>Chào ${customerInfo.ho_ten},</h3>
                    <p>Chúng tôi rất tiếc phải thông báo rằng chúng tôi đã nhận được một biên bản vi phạm giao thông liên quan đến đơn thuê #${don_thue_id} của bạn.</p>
                    <ul>
                        <li><strong>Xe:</strong> ${customerInfo.ten_phuong_tien} (${customerInfo.bien_so})</li>
                        <li><strong>Loại vi phạm:</strong> ${loai_vi_pham}</li>
                    </ul>
                    <p>Chúng tôi sẽ liên hệ lại với bạn sớm. Cảm ơn bạn.</p>
                `
            };

            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailBody)
            });
        }

        return jsonResponse({ success: true, message: "Ghi nhận vi phạm thành công và đã gửi thông báo." }, 201);
    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};