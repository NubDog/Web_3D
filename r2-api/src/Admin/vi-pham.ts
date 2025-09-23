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
  RESEND_API_KEY: string;
}

// Lấy danh sách tất cả vi phạm
export const handleGetViolations = async (request: Request, env: Env) => {
    try {
        const stmt = env.DB.prepare(
            `SELECT 
                vp.*,
                pt.ten_phuong_tien,
                pt.bien_so,
                kh.ho_ten AS ten_khach_hang -- Lấy họ tên từ bảng KhachHang
             FROM ViPham AS vp
             JOIN DonThue AS dt ON vp.don_thue_id = dt.don_thue_id
             JOIN PhuongTien AS pt ON vp.phuong_tien_id = pt.phuong_tien_id -- Join trực tiếp từ ViPham
             JOIN KhachHang AS kh ON dt.khach_hang_id = kh.nguoi_dung_id -- Sửa JOIN
             ORDER BY vp.ngay_tao DESC` 
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
        
          if (!don_thue_id || !loai_vi_pham) {
            return jsonResponse({ success: false, error: "Thiếu thông tin bắt buộc." }, 400);
        }

        const rentalOrder = await env.DB.prepare(
            `SELECT phuong_tien_id FROM DonThue WHERE don_thue_id = ?`
        ).bind(don_thue_id).first<{ phuong_tien_id: number }>();

        if (!rentalOrder) {
            return jsonResponse({ success: false, error: `Không tìm thấy đơn thuê với ID: ${don_thue_id}` }, 404);
        }
        const phuong_tien_id = rentalOrder.phuong_tien_id;

        const stmt = env.DB.prepare(
            `INSERT INTO ViPham (don_thue_id, phuong_tien_id, loai_vi_pham, so_tien_phat, thoi_gian_xay_ra, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?)`
        );
       await stmt.bind(
            don_thue_id, 
            phuong_tien_id, 
            loai_vi_pham, 
            so_tien_phat || 0, 
            thoi_gian_xay_ra, 
            ghi_chu || null
        ).run();

       const infoStmt = env.DB.prepare(
            `SELECT 
                kh.ho_ten, 
                nd.email, 
                pt.ten_phuong_tien, 
                pt.bien_so
             FROM DonThue dt
             JOIN KhachHang kh ON dt.khach_hang_id = kh.nguoi_dung_id
             JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
             JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
             WHERE dt.don_thue_id = ?`
        );
        const customerInfo = await infoStmt.bind(don_thue_id).first<{ ho_ten: string, email: string, ten_phuong_tien: string, bien_so: string }>();

        if (customerInfo && env.RESEND_API_KEY) {
            const emailBody = {
                from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                to: 'Khoatran3123@gmail.com', // dùng 'customerInfo.email' để gọi email từ database còn bây giờ dùng email bản thân để test
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
           

           const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailBody)
            });

             if (!resendResponse.ok) {
                const errorResult = await resendResponse.json();
                console.error("Gửi email thất bại. Lỗi từ Resend:", JSON.stringify(errorResult, null, 2));
            } else {
                console.log("Gửi email thành công!");
            }
        } else {
            if (!customerInfo) console.error("Không tìm thấy thông tin khách hàng để gửi email.");
            if (!env.RESEND_API_KEY) console.error("Thiếu RESEND_API_KEY trong biến môi trường.");
        }

        return jsonResponse({ success: true, message: "Ghi nhận vi phạm thành công và đã gửi thông báo." }, 201);
    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};