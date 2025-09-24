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
  VIO: R2Bucket;
}

// Lấy danh sách tất cả vi phạm + làm chức năng lọc trạng thái vi phạm
export const handleGetViolations = async (request: Request, env: Env) => {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status'); // Lấy trạng thái từ query param

        let query = `
            SELECT 
                vp.vi_pham_id, vp.don_thue_id, pt.ten_phuong_tien, pt.bien_so,
                kh.ho_ten AS ten_khach_hang, vp.loai_vi_pham, vp.so_tien_phat,
                vp.trang_thai, vp.thoi_gian_xay_ra, vp.co_quan_xu_ly,
                vp.duong_dan_bang_chung 
            FROM ViPham AS vp
            JOIN DonThue AS dt ON vp.don_thue_id = dt.don_thue_id
            JOIN PhuongTien AS pt ON vp.phuong_tien_id = pt.phuong_tien_id
            JOIN KhachHang AS kh ON dt.khach_hang_id = kh.nguoi_dung_id
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' WHERE vp.trang_thai = ?';
            params.push(status);
        }

        query += ' ORDER BY vp.ngay_tao DESC';
        
        const stmt = params.length > 0 ? env.DB.prepare(query).bind(...params) : env.DB.prepare(query);
        const { results } = await stmt.all();

        return jsonResponse({ success: true, data: results });
    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

// Ghi nhận một vi phạm mới
export const handleCreateViolation = async (request: Request, env: Env) => {
    try {
    const formData = await request.formData();

        const don_thue_id = parseInt(formData.get('don_thue_id') as string);
        const loai_vi_pham = formData.get('loai_vi_pham') as string;
        const thoi_gian_xay_ra = formData.get('thoi_gian_xay_ra') as string;
        const so_tien_phat = parseFloat(formData.get('so_tien_phat') as string);
        const ghi_chu = formData.get('ghi_chu') as string;
        const co_quan_xu_ly = formData.get('co_quan_xu_ly') as string
        const bangChungFile = formData.get('bang_chung') as File | null;

        if (!don_thue_id || !loai_vi_pham) {
            return jsonResponse({ success: false, error: "Thiếu thông tin bắt buộc." }, 400);
        }

        let bangChungUrl: string | null = null;
        if (bangChungFile && bangChungFile.size > 0) {
            const uniqueKey = `violations/${Date.now()}-${bangChungFile.name}`;
            await env.VIO.put(uniqueKey, await bangChungFile.arrayBuffer(), {
                httpMetadata: { contentType: bangChungFile.type },
            });
            const publicUrl = "https://pub-cfe7aab5c01d4a828336a20b33010957.r2.dev";
            bangChungUrl = `${publicUrl}/${uniqueKey}`;
        }
        
        const rentalOrder = await env.DB.prepare(`SELECT phuong_tien_id FROM DonThue WHERE don_thue_id = ?`).bind(don_thue_id).first<{ phuong_tien_id: number }>();
        if (!rentalOrder) {
            return jsonResponse({ success: false, error: `Không tìm thấy đơn thuê với ID: ${don_thue_id}` }, 404);
        }
        const phuong_tien_id = rentalOrder.phuong_tien_id;

        const stmt = env.DB.prepare(
            `INSERT INTO ViPham (don_thue_id, phuong_tien_id, loai_vi_pham, so_tien_phat, thoi_gian_xay_ra, ghi_chu, duong_dan_bang_chung, co_quan_xu_ly)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );
        await stmt.bind(don_thue_id, phuong_tien_id, loai_vi_pham, so_tien_phat || 0, thoi_gian_xay_ra || null, ghi_chu || null, bangChungUrl, co_quan_xu_ly).run();

       const infoStmt = env.DB.prepare(
            `SELECT 
                kh.ho_ten, 
                nd.email, 
                pt.ten_phuong_tien, 
                pt.bien_so,
                vp.thoi_gian_xay_ra,    -- Lấy thêm thời gian xảy ra
                vp.co_quan_xu_ly,        -- Lấy thêm cơ quan xử lý
                vp.duong_dan_bang_chung -- Lấy thêm đường dẫn bằng chứng
            FROM ViPham vp
            JOIN DonThue dt ON vp.don_thue_id = dt.don_thue_id
            JOIN KhachHang kh ON dt.khach_hang_id = kh.nguoi_dung_id
            JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
            JOIN PhuongTien pt ON vp.phuong_tien_id = pt.phuong_tien_id
            WHERE dt.don_thue_id = ?`
        );
        const customerInfo = await infoStmt.bind(don_thue_id).first<{ 
            ho_ten: string, email: string, ten_phuong_tien: string, bien_so: string, thoi_gian_xay_ra: string, duong_dan_bang_chung: File, co_quan_xu_ly:string
        }>();

        if (customerInfo && env.RESEND_API_KEY) {
            const thoiGianDaFormat = new Date(customerInfo.thoi_gian_xay_ra).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            const emailBody = {
                from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                to: 'khoatran3123@gmail.com', // dùng 'customerInfo.email' để gọi email từ database còn bây giờ dùng email bản thân để test
                subject: `Thông báo về vi phạm giao thông cho đơn thuê #${don_thue_id}`,
                 html: 
                 `<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Thông báo Vi phạm Giao thông</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; border: 1px solid #cccccc;">
                            <tr>
                                <td align="center" bgcolor="#008cffff" style="padding: 20px 0;">          
                                    <H1>Dịch vụ cho thuê đa phương tiện</H1>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff" style="padding: 40px 30px;">
                                    <h2 style="color: #333333; margin-top: 0;">Chào ${customerInfo.ho_ten},</h2>
                                    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                                        Chúng tôi rất tiếc phải thông báo rằng hệ thống đã ghi nhận một biên bản vi phạm giao thông liên quan đến đơn thuê <strong>#${don_thue_id}</strong> của bạn.
                                    </p>
                                    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                                        Chi tiết vi phạm như sau:
                                    </p>
                                    <table width="100%" style="border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 16px;">
                                        <tr style="border-bottom: 1px solid #eeeeee;">
                                            <td style="padding: 10px; color: #555555; width: 150px;"><strong>Xe Vi Phạm:</strong></td>
                                            <td style="padding: 10px; color: #555555;">${customerInfo.ten_phuong_tien} (${customerInfo.bien_so})</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #eeeeee;">
                                            <td style="padding: 10px; color: #555555;"><strong>Loại vi phạm:</strong></td>
                                            <td style="padding: 10px; color: #555555;">${loai_vi_pham}</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #eeeeee;">
                                            <td style="padding: 10px; color: #555555;"><strong>Thời gian xảy ra:</strong></td>
                                            <td style="padding: 10px; color: #555555;">${thoiGianDaFormat}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px; color: #555555;"><strong>Cơ quan xử lý:</strong></td>
                                            <td style="padding: 10px; color: #555555;">${customerInfo.co_quan_xu_ly || 'Chưa có thông tin'}</td>
                                        </tr>
                                    </table>
                                    
                                    ${customerInfo.duong_dan_bang_chung ? 
                                        `<p style="text-align: center; margin-top: 30px;">
                                            <a href="${customerInfo.duong_dan_bang_chung}" style="background-color: #0d6efd; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                                Xem bằng chứng
                                            </a>
                                        </p>
                                        <p style="text-align: center; margin-top: 15px;">
                                            <img src="${customerInfo.duong_dan_bang_chung}" alt="Bằng chứng vi phạm" width="300" style="max-width: 100%; border-radius: 5px;" />
                                        </p>`
                                        : ''
                                    }

                                    <p style="color: #555555; font-size: 16px; line-height: 1.5; margin-top: 30px;">
                                        Chúng tôi sẽ liên hệ lại với bạn sớm để hướng dẫn các bước xử lý tiếp theo.
                                    </p>
                                    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                                        Trân trọng,<br/>
                                        Đội ngũ Dịch vụ cho thuê đa phương tiện
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#f4f4f4" style="padding: 20px 30px; text-align: center;">
                                    <p style="margin: 0; color: #888888; font-size: 12px;">
                                        Đây là email tự động, vui lòng không trả lời.
                                        <br/>
                                        &copy; 2025Dịch vụ cho thuê đa phương tiện. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
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

export async function handleUpdateViolation(request: Request, env: Env, violationId: string) {
    try {
        const body = await request.json<any>();
        
         const { trang_thai, so_tien_phat, ghi_chu, co_quan_xu_ly } = body;

        if (trang_thai === undefined && so_tien_phat === undefined && ghi_chu === undefined && co_quan_xu_ly === undefined) {
            return jsonResponse({ success: false, error: "Không có thông tin nào để cập nhật." }, 400);
        }

        const fieldsToUpdate = [];
        const values = [];

        if (trang_thai) {
            fieldsToUpdate.push("trang_thai = ?");
            values.push(trang_thai);
        }
        if (so_tien_phat !== undefined) {
            fieldsToUpdate.push("so_tien_phat = ?");
            values.push(so_tien_phat);
        }
        if (ghi_chu !== undefined) {
            fieldsToUpdate.push("ghi_chu = ?");
            values.push(ghi_chu);
        }

        if (co_quan_xu_ly !== undefined) {
            fieldsToUpdate.push("co_quan_xu_ly = ?");
            values.push(co_quan_xu_ly);
        }
        
        values.push(violationId);

        const query = `UPDATE ViPham SET ${fieldsToUpdate.join(', ')}, ngay_cap_nhat = CURRENT_TIMESTAMP WHERE vi_pham_id = ?`;
        
        const { meta } = await env.DB.prepare(query).bind(...values).run();

        if (meta.changes === 0) {
            return jsonResponse({ success: false, error: `Không tìm thấy vi phạm với ID: ${violationId}` }, 404);
        }

        if (trang_thai && ['da_thanh_toan', 'huy_bo'].includes(trang_thai)) {
            
            const infoStmt = env.DB.prepare(
                `SELECT 
                    kh.ho_ten, 
                    nd.email, 
                    pt.ten_phuong_tien, 
                    pt.bien_so,
                    vp.don_thue_id,
                    vp.loai_vi_pham,
                    vp.so_tien_phat,
                    vp.thoi_gian_xay_ra,
                    vp.co_quan_xu_ly
                 FROM ViPham vp
                 JOIN DonThue dt ON vp.don_thue_id = dt.don_thue_id
                 JOIN KhachHang kh ON dt.khach_hang_id = kh.nguoi_dung_id
                 JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
                 JOIN PhuongTien pt ON vp.phuong_tien_id = pt.phuong_tien_id
                 WHERE vp.vi_pham_id = ?`
            );
            const violationInfo = await infoStmt.bind(violationId).first<any>();

            if (violationInfo && env.RESEND_API_KEY) {
                let subject = '';
                let htmlBody = '';
                const thoiGianDaFormat = new Date(violationInfo.thoi_gian_xay_ra).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                });

                if (trang_thai === 'da_thanh_toan') {
                    subject = `Xác nhận thanh toán vi phạm cho đơn thuê #${violationInfo.don_thue_id}`;
                    htmlBody = `
                                    <!DOCTYPE html>
                                    <html lang="vi">
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <title>Xác nhận thanh toán vi phạm</title>
                                    </head>
                                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f2f4f6;">
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; border-collapse: collapse;">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <H1>Dịch vụ cho thuê đa phương tiện</H1>
                                                </td>
                                            </tr>
                                            
                                            <tr>
                                                <td bgcolor="#ffffff" style="padding: 30px 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                                    <h2 style="margin-top: 0; color: #15a374; font-size: 24px; font-weight: 600;">
                                                        Thanh toán vi phạm thành công
                                                    </h2>
                                                    
                                                    <p style="margin: 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
                                                        Chào ${violationInfo.ho_ten},
                                                    </p>
                                                    
                                                    <p style="margin: 0 0 20px; color: #495057; font-size: 16px; line-height: 1.6;">
                                                        Chúng tôi xác nhận đã nhận được thanh toán cho vi phạm giao thông liên quan đến đơn thuê <strong>#${violationInfo.don_thue_id}</strong> của bạn.
                                                    </p>
                                                    
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #dee2e6; border-radius: 8px; margin: 25px 0; font-size: 15px;">
                                                        <tr>
                                                            <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #6c757d;">Xe vi phạm</td>
                                                            <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; font-weight: 500;">${violationInfo.ten_phuong_tien} (${violationInfo.bien_so})</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #6c757d;">Loại vi phạm</td>
                                                            <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; font-weight: 500;">${violationInfo.loai_vi_pham}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #6c757d;">Thời gian xảy ra</td>
                                                            <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; font-weight: 500;">${thoiGianDaFormat}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 15px; color: #6c757d;">Số tiền đã thanh toán</td>
                                                            <td style="padding: 12px 15px; color: #212529; font-weight: 600;">${new Intl.NumberFormat('vi-VN').format(violationInfo.so_tien_phat)} VND</td>
                                                        </tr>
                                                    </table>

                                                    <p style="margin: 0; color: #495057; font-size: 16px; line-height: 1.6;">
                                                        Vấn đề đã được giải quyết. Cảm ơn bạn đã tin tưởng và hợp tác.
                                                        <br><br>
                                                        Trân trọng,
                                                        <br>
                                                        Dịch vụ cho thuê đa phương tiện
                                                    </p>
                                                </td>
                                            </tr>
                                            
                                            <tr>
                                                <td align="center" style="padding: 25px 30px;">
                                                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                                        Bạn nhận được email này vì bạn có một vi phạm liên quan đến dịch vụ của chúng tôi.
                                                        <br>
                                                        &copy; 2025 Tên Công ty của bạn. Đã đăng ký bản quyền.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </body>
                                    </html>
                                `;
                } else if (trang_thai === 'huy_bo') {
                    subject = `Thông báo hủy vi phạm cho đơn thuê #${violationInfo.don_thue_id}`;
                    htmlBody = `
                                <!DOCTYPE html>
                                <html lang="vi">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Thông báo hủy vi phạm</title>
                                </head>
                                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f2f4f6;">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; border-collapse: collapse;">
                                        <tr>
                                            <td align="center" style="padding: 20px 0;">
                                                <H1>Dịch vụ cho thuê đa phương tiện</H1>
                                            </td>
                                        </tr>
                                        
                                        <tr>
                                            <td bgcolor="#ffffff" style="padding: 30px 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                                <h2 style="margin-top: 0; color: #555; font-size: 24px; font-weight: 600;">
                                                    Thông báo Hủy vi phạm
                                                </h2>
                                                
                                                <p style="margin: 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
                                                    Chào ${violationInfo.ho_ten},
                                                </p>
                                                
                                                <p style="margin: 0 0 20px; color: #495057; font-size: 16px; line-height: 1.6;">
                                                    Sau khi xem xét lại, chúng tôi thông báo rằng biên bản vi phạm giao thông liên quan đến đơn thuê <strong>#${violationInfo.don_thue_id}</strong> của bạn đã được <strong>hủy bỏ</strong>.
                                                </p>
                                                
                                                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #dee2e6; border-radius: 8px; margin: 25px 0; font-size: 15px;">
                                                    <tr>
                                                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #6c757d;">Xe vi phạm</td>
                                                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; font-weight: 500;">${violationInfo.ten_phuong_tien} (${violationInfo.bien_so})</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #6c757d;">Loại vi phạm ban đầu</td>
                                                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; font-weight: 500;">${violationInfo.loai_vi_pham}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 12px 15px; color: #6c757d;">Thời gian xảy ra</td>
                                                        <td style="padding: 12px 15px; color: #212529; font-weight: 500;">${thoiGianDaFormat}</td>
                                                    </tr>
                                                </table>

                                                <p style="margin: 0; color: #495057; font-size: 16px; line-height: 1.6;">
                                                    Bạn không cần thực hiện thêm bất kỳ hành động nào. Xin lỗi vì sự bất tiện này (nếu có).
                                                    <br><br>
                                                    Trân trọng,
                                                    <br>
                                                    Dịch vụ cho thuê đa phương tiện
                                                </p>
                                            </td>
                                        </tr>
                                        
                                        <tr>
                                            <td align="center" style="padding: 25px 30px;">
                                                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                                    Bạn nhận được email này vì bạn có một vi phạm liên quan đến dịch vụ của chúng tôi.
                                                    <br>
                                                    &copy; 2025 Dịch vụ cho thuê đa phương tiện. Đã đăng ký bản quyền.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>
                                `;
                }

                const emailBody = {
                    from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>', 
                    to: 'khoatran3123@gmail.com', // dùng 'customerInfo.email' để gọi email từ database còn bây giờ dùng email bản thân để test
                    subject: subject,
                    html: htmlBody
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
                }
            }
        }


        return jsonResponse({ success: true, message: "Cập nhật vi phạm thành công." });

    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi khi cập nhật vi phạm.', details: e.message }, 500);
    }
}

export const handleDeleteViolation = async (request: Request, env: Env, violationId: string) => {
    try {
        const { meta } = await env.DB.prepare(
            `DELETE FROM ViPham WHERE vi_pham_id = ?`
        ).bind(violationId).run();

        if (meta.changes === 0) {
            return jsonResponse({ success: false, error: `Không tìm thấy vi phạm với ID: ${violationId} để xóa.` }, 404);
        }

        return jsonResponse({ success: true, message: "Xóa vi phạm thành công." });
    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi khi xóa vi phạm.', details: e.message }, 500);
    }
}