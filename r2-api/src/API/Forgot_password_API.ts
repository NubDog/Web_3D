
interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
}

const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { 
        status, 
        headers: { ...defaultHeaders, ...headers } 
    });
};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function getUserWEmail(request: Request, env: Env, email: string) {
    if (!email) {
        return jsonResponse({ success: false, error: "Email không hợp lệ" }, 400);
    }
    
    try {
        const result = await env.DB.prepare(
            `SELECT nguoi_dung_id, ten_dang_nhap, ho_ten, email 
             FROM NguoiDung 
             WHERE email = ?`
        ).bind(email).first();
        
        if (!result) {
            return jsonResponse({ success: false, error: "Email không tồn tại trong hệ thống" }, 404);
        }

        await env.DB.prepare(
            `DELETE FROM ForgotPassword_Token WHERE email = ?`
        ).bind(email).run();

        const token = generateOTP();
        
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 15 * 60000); // +15 phút
        
        const expiresAtStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19);

        const createToken = await env.DB.prepare(
            `INSERT INTO ForgotPassword_Token (token, email, expires_at, created_at, updated_at) 
             VALUES (?, ?, ?, datetime('now'), datetime('now'))`
        ).bind(token, email, expiresAtStr).run();

        if (!createToken.success) {
            return jsonResponse({ success: false, error: "Không thể tạo mã xác nhận" }, 500);
        }

        if (env.RESEND_API_KEY) {
            console.log("🔥 Đang gửi mail đến:", email);
            console.log("🔑 OTP:", token);

            const emailBody = {
                from: 'Dịch Vụ Thuê Đa Phương Tiện <onboarding@resend.dev>',
                to: 'khoatran3123@gmail.com', 
                subject: `Mã khôi phục mật khẩu - ${token}`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; border: 1px solid #cccccc; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                        <tr>
                            <td align="center" bgcolor="#008cffff" style="padding: 30px 0;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">KHÔI PHỤC MẬT KHẨU</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px; color: #333333; line-height: 1.6;">
                                <p style="margin: 0 0 20px 0; font-size: 16px;">Xin chào,</p>
                                
                                <p style="margin: 0 0 20px 0; font-size: 16px;">
                                    Yêu cầu khôi phục mật khẩu cho tài khoản: <strong>${email}</strong>
                                </p>

                                <p style="margin: 0 0 10px 0; font-size: 16px;">
                                    Mã xác nhận của bạn:
                                </p>

                                <div style="background-color: #f0f8ff; border: 2px dashed #008cffff; border-radius: 5px; text-align: center; padding: 20px; margin: 30px 0;">
                                    <span style="font-size: 32px; font-weight: bold; color: #008cffff; letter-spacing: 5px;">
                                        ${token}
                                    </span>
                                </div>

                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #dc3545;">
                                    <strong>Lưu ý:</strong> Mã này hết hạn sau <strong>15 phút</strong>.
                                </p>

                                <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">
                                    Nếu không phải bạn, vui lòng bỏ qua email này.
                                </p>

                                <p style="margin: 0; font-size: 16px;">
                                    Trân trọng,<br>
                                    Đội ngũ Hỗ trợ
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#f4f4f4" style="padding: 20px 30px; text-align: center; border-top: 1px solid #cccccc;">
                                <p style="margin: 0; color: #888888; font-size: 12px;">
                                    &copy; ${new Date().getFullYear()} Dịch vụ cho thuê đa phương tiện.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`
            };

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(emailBody)
            });

            const resData = await res.json();

            if (res.ok) {
                console.log("✅ Gửi mail thành công!", resData);
            } else {
                console.error("❌ Lỗi Resend:", resData);
            }

        } else {
            console.log("⚠️ Không có RESEND_API_KEY");
        }

        return jsonResponse({ 
            success: true, 
            message: "Đã gửi mã xác nhận đến email",
            data: result 
        });
        
    } catch (e: any) {
        console.error("❌ Lỗi:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
}

export async function getToken(request: Request, env: Env, email: string) {
    const result = await env.DB.prepare(
        `SELECT * FROM ForgotPassword_Token
         WHERE email = ?
         ORDER BY created_at DESC
         LIMIT 1`
    ).bind(email).first<any>();

    if (!result) {
        return jsonResponse({ success: false, error: "Token không tồn tại" }, 404);
    }
    return jsonResponse({ success: true, data: result });
}

export async function verifyTokenAndUpdatePassword(request: Request, env: Env) {    
    try {
        const { email, token, newPassword } = await request.json() as any;
        
        if (!email || !token || !newPassword) {
            return jsonResponse({ 
                success: false, 
                error: "Vui lòng điền đầy đủ thông tin" 
            }, 400);
        }

        const result = await env.DB.prepare(
            `SELECT * FROM ForgotPassword_Token 
             WHERE email = ? 
             ORDER BY created_at DESC 
             LIMIT 1`
        ).bind(email).first<any>(); 
        
        if (!result) {
            return jsonResponse({ 
                success: false, 
                error: "Token không tồn tại hoặc email sai" 
            }, 404);
        }

        if (String(result.token) !== String(token)) {
            return jsonResponse({ 
                success: false, 
                error: "Mã xác nhận không chính xác" 
            }, 400);
        }

        const now = new Date();
        const expiresAt = new Date(result.expires_at);

        console.log("⏰ Now:", now.toISOString());
        console.log("⏰ Expires:", expiresAt.toISOString());

        if (now > expiresAt) {
            return jsonResponse({ 
                success: false, 
                error: "Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới." 
            }, 400);
        }

        const updateResult = await env.DB.prepare(
            `UPDATE NguoiDung SET mat_khau = ? WHERE email = ?`
        ).bind(newPassword, email).run();

        if (updateResult.success) {
            await env.DB.prepare(
                `DELETE FROM ForgotPassword_Token WHERE email = ?`
            ).bind(email).run();

            return jsonResponse({ 
                success: true, 
                message: "Đổi mật khẩu thành công!" 
            });
        } else {
            return jsonResponse({ 
                success: false, 
                error: "Không thể cập nhật mật khẩu" 
            }, 500);
        }

    } catch (e: any) {
        console.error("❌ Lỗi:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
}
