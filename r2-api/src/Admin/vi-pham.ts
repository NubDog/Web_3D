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
        const co_quan_xu_ly = formData.get('co_quan_xu_ly') as string;
        const bangChungFile = formData.get('bang_chung') as File | null;

        if (!don_thue_id || !loai_vi_pham) {
            return jsonResponse({ success: false, error: "Thiếu thông tin bắt buộc." }, 400);
        }

        // Upload bằng chứng
        let bangChungUrl: string | null = null;
        if (bangChungFile && bangChungFile.size > 0) {
            const uniqueKey = `violations/${Date.now()}-${bangChungFile.name}`;
            await env.VIO.put(uniqueKey, await bangChungFile.arrayBuffer(), {
                httpMetadata: { contentType: bangChungFile.type },
            });
            bangChungUrl = `https://pub-cfe7aab5c01d4a828336a20b33010957.r2.dev/${uniqueKey}`;
        }

        // Lấy thông tin đơn thuê + khách hàng
        const rentalOrder = await env.DB.prepare(`
            SELECT dt.phuong_tien_id, dt.trang_thai, dt.khach_hang_id,
                   kh.ho_ten, nd.email,
                   pt.ten_phuong_tien, pt.bien_so
            FROM DonThue dt
            JOIN KhachHang kh ON dt.khach_hang_id = kh.khach_hang_id
            JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
            JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
            WHERE dt.don_thue_id = ?
        `).bind(don_thue_id).first<{
            phuong_tien_id: number;
            trang_thai: string;
            khach_hang_id: number;
            ho_ten: string;
            email: string;
            ten_phuong_tien: string;
            bien_so: string;
        }>();

        if (!rentalOrder) {
            return jsonResponse({ success: false, error: `Không tìm thấy đơn thuê với ID: ${don_thue_id}` }, 404);
        }

        // CHO PHÉP ghi vi phạm ở nhiều trạng thái hơn
        // (Vi phạm giao thông có thể được ghi nhận sau khi hoàn tất đơn)
        const allowedStatuses = ['DANG_THUE', 'DA_TRA', 'HOAN_TAT'];
        if (!allowedStatuses.includes(rentalOrder.trang_thai)) {
            return jsonResponse({ 
                success: false, 
                error: `Không thể ghi vi phạm cho đơn ở trạng thái "${rentalOrder.trang_thai}". Chỉ cho phép: ${allowedStatuses.join(', ')}` 
            }, 400);
        }

        await env.DB.prepare(`
            INSERT INTO ViPham (
                don_thue_id, 
                phuong_tien_id, 
                khach_hang_id,
                loai_vi_pham, 
                so_tien_phat, 
                thoi_gian_xay_ra, 
                ghi_chu, 
                duong_dan_bang_chung, 
                co_quan_xu_ly,
                trang_thai
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'chua_xu_ly')
        `).bind(
            don_thue_id,
            rentalOrder.phuong_tien_id,
            rentalOrder.khach_hang_id,
            loai_vi_pham,
            so_tien_phat || 0,
            thoi_gian_xay_ra || null,
            ghi_chu || null,
            bangChungUrl,
            co_quan_xu_ly || null
        ).run();

        // Gửi email thông báo
        if (env.RESEND_API_KEY && rentalOrder.email) {
            const thoiGianFormat = thoi_gian_xay_ra 
                ? new Date(thoi_gian_xay_ra).toLocaleString('vi-VN')
                : 'Chưa xác định';

            const emailBody = {
                from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                to: ['khoatran3123@gmail.com'], //rentalOrder.email 
                subject: `⚠️ Thông báo vi phạm giao thông - Đơn thuê #${don_thue_id}`,
                html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                    <table align="center" width="600" style="background: white; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td style="background: #dc3545; color: white; padding: 20px; text-align: center;">
                                <h1 style="margin: 0;">⚠️ THÔNG BÁO VI PHẠM</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px;">
                                <p>Chào <strong>${rentalOrder.ho_ten}</strong>,</p>
                                <p>Hệ thống đã ghi nhận một vi phạm giao thông liên quan đến đơn thuê <strong>#${don_thue_id}</strong> của bạn.</p>
                                
                                <table width="100%" style="border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
                                    <tr style="border-bottom: 1px solid #ddd;">
                                        <td style="padding: 12px; color: #666;">Xe vi phạm</td>
                                        <td style="padding: 12px; font-weight: bold;">${rentalOrder.ten_phuong_tien} (${rentalOrder.bien_so})</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #ddd;">
                                        <td style="padding: 12px; color: #666;">Loại vi phạm</td>
                                        <td style="padding: 12px; font-weight: bold;">${loai_vi_pham}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #ddd;">
                                        <td style="padding: 12px; color: #666;">Thời gian</td>
                                        <td style="padding: 12px;">${thoiGianFormat}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #ddd;">
                                        <td style="padding: 12px; color: #666;">Cơ quan xử lý</td>
                                        <td style="padding: 12px;">${co_quan_xu_ly || 'Đang cập nhật'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px; color: #666;">Số tiền phạt</td>
                                        <td style="padding: 12px; color: #dc3545; font-weight: bold; font-size: 18px;">
                                            ${new Intl.NumberFormat('vi-VN').format(so_tien_phat || 0)} VND
                                        </td>
                                    </tr>
                                </table>

                                ${bangChungUrl ? `
                                <p style="text-align: center;">
                                    <a href="${bangChungUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                                        📷 Xem bằng chứng
                                    </a>
                                </p>
                                ` : ''}

                                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
                                    <p style="margin: 0; color: #856404;">
                                        <strong>⚠️ Lưu ý:</strong> Vi phạm này cần được xử lý trước khi bạn có thể thuê xe tiếp. 
                                        Vui lòng liên hệ với chúng tôi để được hướng dẫn.
                                    </p>
                                </div>

                                <p style="margin-top: 30px; color: #666;">
                                    Trân trọng,<br>
                                    <strong>Dịch vụ cho thuê xe</strong>
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
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

        return jsonResponse({ 
            success: true, 
            message: "Ghi nhận vi phạm thành công và đã gửi thông báo cho khách hàng." 
        }, 201);

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
                    to: `khoatran3123@gmail.com`, // dùng 'customerInfo.email' để gọi email từ database còn bây giờ dùng email bản thân để test
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

// KIỂM TRA VI PHẠM CỦA KHÁCH HÀNG
// Gọi trước khi duyệt đơn
export const handleCheckCustomerViolations = async (
    request: Request, 
    env: Env, 
    khachHangId: string
) => {
    try {
        // Lấy danh sách vi phạm CHƯA XỬ LÝ của khách hàng
        const { results } = await env.DB.prepare(`
            SELECT 
                vp.vi_pham_id,
                vp.don_thue_id,
                vp.loai_vi_pham,
                vp.so_tien_phat,
                vp.trang_thai,
                vp.thoi_gian_xay_ra,
                vp.co_quan_xu_ly,
                pt.ten_phuong_tien,
                pt.bien_so
            FROM ViPham vp
            JOIN DonThue dt ON vp.don_thue_id = dt.don_thue_id
            JOIN PhuongTien pt ON vp.phuong_tien_id = pt.phuong_tien_id
            WHERE dt.khach_hang_id = ? 
            AND vp.trang_thai = 'chua_xu_ly'
            ORDER BY vp.ngay_tao DESC
        `).bind(khachHangId).all();

        // Tính tổng tiền nợ
        const tongTienNo = results.reduce((sum: number, v: any) => sum + (v.so_tien_phat || 0), 0);

        return jsonResponse({
            success: true,
            data: {
                has_pending_violations: results.length > 0,
                total_violations: results.length,
                total_debt: tongTienNo,
                violations: results
            }
        });

    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

// LẤY LỊCH SỬ VI PHẠM TOÀN BỘ CỦA KHÁCH
// (Bao gồm cả đã xử lý để admin xem xét)
export const handleGetCustomerViolationHistory = async (
    request: Request, 
    env: Env, 
    khachHangId: string
) => {
    try {
        const { results } = await env.DB.prepare(`
            SELECT 
                vp.vi_pham_id,
                vp.don_thue_id,
                vp.loai_vi_pham,
                vp.so_tien_phat,
                vp.trang_thai,
                vp.thoi_gian_xay_ra,
                vp.co_quan_xu_ly,
                vp.ghi_chu,
                vp.ngay_tao,
                pt.ten_phuong_tien,
                pt.bien_so
            FROM ViPham vp
            JOIN DonThue dt ON vp.don_thue_id = dt.don_thue_id
            JOIN PhuongTien pt ON vp.phuong_tien_id = pt.phuong_tien_id
            WHERE dt.khach_hang_id = ?
            ORDER BY vp.ngay_tao DESC
        `).bind(khachHangId).all();

        // Thống kê
        const stats = {
            total: results.length,
            pending: results.filter((v: any) => v.trang_thai === 'chua_xu_ly').length,
            paid: results.filter((v: any) => v.trang_thai === 'da_thanh_toan').length,
            cancelled: results.filter((v: any) => v.trang_thai === 'huy_bo').length,
            total_fines: results.reduce((sum: number, v: any) => sum + (v.so_tien_phat || 0), 0),
            unpaid_fines: results
                .filter((v: any) => v.trang_thai === 'chua_xu_ly')
                .reduce((sum: number, v: any) => sum + (v.so_tien_phat || 0), 0)
        };

        return jsonResponse({
            success: true,
            data: {
                stats,
                violations: results
            }
        });

    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

// LẤY VI PHẠM CHO NHIỀU KHÁCH HÀNG CÙNG LÚC
// Dùng cho danh sách đơn hàng
export const handleBatchCheckViolations = async (request: Request, env: Env) => {
    try {
        const { khach_hang_ids } = await request.json<{ khach_hang_ids: number[] }>();
        
        if (!khach_hang_ids || khach_hang_ids.length === 0) {
            return jsonResponse({ success: true, data: {} });
        }

        const placeholders = khach_hang_ids.map(() => '?').join(',');
        
        const { results } = await env.DB.prepare(`
            SELECT 
                vp.khach_hang_id,
                COUNT(*) as total_violations,
                SUM(vp.so_tien_phat) as total_debt,
                MAX(vp.loai_vi_pham) as latest_violation_type
            FROM ViPham vp
            WHERE vp.khach_hang_id IN (${placeholders})
            AND vp.trang_thai = 'chua_xu_ly'
            GROUP BY vp.khach_hang_id
        `).bind(...khach_hang_ids).all();

        const violationMap: Record<number, any> = {};
        results.forEach((r: any) => {
            violationMap[r.khach_hang_id] = {
                has_violations: true,
                total_violations: r.total_violations,
                total_debt: r.total_debt || 0,
                latest_violation_type: r.latest_violation_type
            };
        });

        return jsonResponse({ success: true, data: violationMap });

    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

export const handleConfirmViolationPayment = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id } = await request.json<{ nhan_vien_id: number }>();
        
        if (!nhan_vien_id) {
            return jsonResponse({ success: false, error: 'Thiếu ID nhân viên' }, 400);
        }

        const orderInfo = await env.DB.prepare(`
            SELECT khach_hang_id, ghi_chu 
            FROM DonThue 
            WHERE don_thue_id = ?
        `).bind(orderId).first<{ khach_hang_id: number; ghi_chu: string }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: 'Không tìm thấy đơn' }, 404);
        }

        if (!orderInfo.ghi_chu || !orderInfo.ghi_chu.includes('[CONDITION: PAY_FIRST]')) {
            return jsonResponse({ 
                success: false, 
                error: 'Đơn này không yêu cầu thanh toán vi phạm trước' 
            }, 400);
        }

        const violations = await env.DB.prepare(`
            SELECT vi_pham_id, loai_vi_pham, so_tien_phat
            FROM ViPham
            WHERE khach_hang_id = ? AND trang_thai = 'chua_xu_ly'
        `).bind(orderInfo.khach_hang_id).all();

        if (violations.results.length === 0) {
            return jsonResponse({ 
                success: false, 
                error: 'Không có vi phạm cần xử lý' 
            }, 400);
        }

        const updatePromises = violations.results.map((v: any) => 
            env.DB.prepare(`
                UPDATE ViPham 
                SET trang_thai = 'da_thanh_toan',
                    nhan_vien_xu_ly_id = ?,
                    ngay_xu_ly = datetime('now', '+7 hours')
                WHERE vi_pham_id = ?
            `).bind(nhan_vien_id, v.vi_pham_id).run()
        );

        await Promise.all(updatePromises);

        if (env.RESEND_API_KEY) {
            const customerInfo = await env.DB.prepare(`
                SELECT kh.ho_ten, nd.email
                FROM KhachHang kh
                JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
                WHERE kh.khach_hang_id = ?
            `).bind(orderInfo.khach_hang_id).first<{ ho_ten: string; email: string }>();

            if (customerInfo) {
                const totalDebt = violations.results.reduce((sum: number, v: any) => sum + v.so_tien_phat, 0);
                const fmt = (t: number) => new Intl.NumberFormat('vi-VN').format(t) + ' đ';

                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                        <table align="center" width="600" style="margin: 20px auto; border: 1px solid #ccc; background: #fff;">
                            <tr>
                                <td align="center" bgcolor="#15a374" style="padding: 20px;">
                                    <h1 style="color: #fff; margin: 0;">✅ XÁC NHẬN THANH TOÁN VI PHẠM</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #333;">Xin chào ${customerInfo.ho_ten},</h2>
                                    
                                    <p style="font-size: 16px; line-height: 1.6; color: #555;">
                                        Chúng tôi xác nhận đã nhận được thanh toán <strong>${violations.results.length} vi phạm</strong> 
                                        với tổng số tiền <strong style="color: #15a374; font-size: 20px;">${fmt(totalDebt)}</strong>.
                                    </p>

                                    <h3 style="border-bottom: 2px solid #15a374; padding-bottom: 10px;">📋 Danh sách vi phạm đã thanh toán</h3>
                                    <table width="100%" style="border-collapse: collapse; margin: 20px 0;">
                                        ${violations.results.map((v: any, i: number) => `
                                            <tr style="border-bottom: 1px solid #eee;">
                                                <td style="padding: 12px;">${i + 1}. <strong>${v.loai_vi_pham}</strong></td>
                                                <td style="padding: 12px; text-align: right; color: #15a374; font-weight: bold;">
                                                    ${fmt(v.so_tien_phat)}
                                                </td>
                                            </tr>
                                        `).join('')}
                                        <tr style="background: #e8f5e9;">
                                            <td style="padding: 15px; font-weight: bold;">TỔNG ĐÃ THANH TOÁN</td>
                                            <td style="padding: 15px; text-align: right; color: #15a374; font-size: 22px; font-weight: bold;">
                                                ${fmt(totalDebt)}
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 5px solid #15a374;">
                                        <p style="margin: 0; color: #2e7d32; font-weight: bold;">
                                            ✅ Vấn đề đã được giải quyết. Bạn có thể tiếp tục đặt cọc xe.
                                        </p>
                                    </div>

                                    <p style="margin-top: 30px; color: #555;">
                                        Cảm ơn bạn đã hợp tác!<br><br>
                                        Trân trọng,<br>
                                        <strong>Dịch vụ cho thuê đa phương tiện</strong>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                        to: 'khoatran3123@gmail.com',
                        subject: `✅ Đã xác nhận thanh toán ${violations.results.length} vi phạm - Đơn #${orderId}`,
                        html: emailHtml
                    })
                });
            }
        }

        return jsonResponse({
            success: true,
            message: `Đã xác nhận thanh toán ${violations.results.length} vi phạm`,
            violations_cleared: violations.results.length
        });

    } catch (e: any) {
        console.error('Error confirming violation payment:', e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};