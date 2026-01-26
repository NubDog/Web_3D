import { getAppConfig } from "./Config/App.Config";
export interface Env {
    DB: D1Database;
    hd: R2Bucket; 
    RESEND_API_KEY: string; 
}

interface OverdueNotification {
  don_thue_id: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  ten_phuong_tien: string;
  bien_so: string;
  ngay_bat_dau:string
  ngay_ket_thuc: string;
  tong_tien: number;
  so_ngay_qua_han: number;
  so_gio_le: number;
  phi_tre_han: number;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // CORS cho frontend gọi
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}



export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/test-db") {
      const { results } = await env.DB.prepare(
        "SELECT MaNguoiDung, HoTen, Email FROM NguoiDung LIMIT 5;"
      ).all();
      return json({ ok: true, data: results });
    }
    if (url.pathname === "/api/orders/overdue/notify" && request.method === "POST") {
          try {
            const result = await sendOverdueNotifications(env);
            return json({
              success: true,
              message: `Đã gửi ${result.sent}/${result.total} email`,
              sent: result.sent,
              total: result.total,
            });
          } catch (error: any) {
            return json({ success: false, error: error.message }, 500);
          }
        }
    return json({ ok: false, error: "Not found" }, 404);
  },

};
export async function handleScheduled(
    event: ScheduledEvent, 
    env: Env, 
    ctx: ExecutionContext
): Promise<void> {
    
    const DeleteForgotPassword_Token = await env.DB.prepare(
            `DELETE FROM ForgotPassword_Token 
             WHERE expires_at < datetime('now')`
    ).run();
    if(!DeleteForgotPassword_Token.results || DeleteForgotPassword_Token.results.length === 0){
        console.log("✅ [CRON] Không có token quá hạn");
    }else{
        console.log("🧹 Đã dọn dẹp token hết hạn");
    }
    
    console.log("🕐 [CRON] Bắt đầu kiểm tra đơn quá hạn cọc...");
    const nowUTC = new Date(event.scheduledTime);
    const nowVN = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
    const hour = nowVN.getHours();
    const minute = nowVN.getMinutes();
    console.log('🕐 [CRON] Thời gian UTC:', nowUTC.toISOString());
    console.log('🕐 [CRON] Thời gian VN (GMT+7):', nowVN.toISOString());
    console.log('🕐 [CRON] Thời gian VN (readable):', nowVN.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
    // console.log("🕐 [CRON] Trigger time:", new Date(event.scheduledTime).toISOString());

    if (hour === 9 && minute === 0) {
        console.log('📧 [CRON] Đúng 9:00 sáng - Gửi email...');
        
        try {
            const result = await sendOverdueNotifications(env);
            console.log(`✅ [CRON] Đã gửi ${result.sent}/${result.total} email`);
        } catch (error: any) {
            console.error('❌ [CRON] Lỗi:', error.message);
        }
    }

    ctx.waitUntil(handleExpiredDeposits(env));

    console.log("🕐 [CRON] Kiểm tra đơn từ chối quá hạn...");
    ctx.waitUntil(handleAutoRejectLevel3Orders(env));

}
/**
 * Logic xử lý hủy đơn quá hạn cọc (5 phút)
 */
async function handleExpiredDeposits(env: Env) {
    try {
        const expiredOrders = await env.DB.prepare(`
            SELECT 
                dt.don_thue_id,
                dt.phuong_tien_id,
                tc.tien_coc_id,
                tc.ngay_giu,
                kh.ho_ten,
                nd.email,
                pt.ten_phuong_tien,
                CAST((julianday('now', '+7 hours') - julianday(tc.ngay_giu)) * 1440 AS INTEGER) as phut_da_qua
            FROM DonThue dt
            JOIN TienCoc tc ON dt.don_thue_id = tc.don_thue_id
            JOIN KhachHang kh ON dt.khach_hang_id = kh.khach_hang_id
            JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
            JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
            WHERE dt.trang_thai = 'DA_DUYET'
              AND tc.trang_thai = 'CHO_THANH_TOAN'
              AND julianday('now', '+7 hours') - julianday(tc.ngay_giu) > (60.0 / 1440.0)
        `).all<{
            don_thue_id: number;
            phuong_tien_id: number;
            tien_coc_id: number;
            ngay_giu: string;
            ho_ten: string;
            email: string;
            ten_phuong_tien: string;
            phut_da_qua: number;
        }>();

        if (!expiredOrders.results || expiredOrders.results.length === 0) {
            console.log("✅ [CRON] Không có đơn quá hạn");
            return { cancelled: 0 };
        }

        console.log(`⚠️ [CRON] Tìm thấy ${expiredOrders.results.length} đơn quá hạn cọc:`);

        let cancelledCount = 0;
        const emailPromises: Promise<void>[] = [];

        const batchStatements = [];

        for (const order of expiredOrders.results) {
            console.log(`  - Đơn #${order.don_thue_id}: ${order.ho_ten} | phương tiện: ${order.ten_phuong_tien} | Quá: ${order.phut_da_qua} phút`);

            batchStatements.push(
                env.DB.prepare(`
                    UPDATE DonThue 
                    SET trang_thai = 'TU_CHOI', 
                        ghi_chu = '[HỆ THỐNG] Tự động hủy do quá 60 phút không thanh toán cọc',
                        ngay_cap_nhat = datetime('now', '+7 hours')
                    WHERE don_thue_id = ?
                `).bind(order.don_thue_id)
            );

            batchStatements.push(
                env.DB.prepare(`
                    UPDATE TienCoc 
                    SET trang_thai = 'HET_HAN',
                        ghi_chu = 'Từ chối đơn do quá hạn cọc',
                        ngay_cap_nhat = datetime('now', '+7 hours')
                    WHERE tien_coc_id = ?
                `).bind(order.tien_coc_id)
            );

            batchStatements.push(
                env.DB.prepare(`
                    UPDATE PhuongTien 
                    SET trang_thai = 'SAN_SANG' 
                    WHERE phuong_tien_id = ? 
                      AND trang_thai != 'SAN_SANG'
                `).bind(order.phuong_tien_id)
            );

            cancelledCount++;

            if (env.RESEND_API_KEY && order.email) {
                emailPromises.push(
                    sendCancellationEmail(env, {
                        email: order.email,
                        ho_ten: order.ho_ten,
                        don_thue_id: order.don_thue_id,
                        ten_phuong_tien: order.ten_phuong_tien
                    })
                );
            }
        }

        await env.DB.batch(batchStatements);
        console.log(`✅ [CRON] Đã hủy ${cancelledCount} đơn quá hạn`);

        if (emailPromises.length > 0) {
            await Promise.allSettled(emailPromises);
            console.log(`📧 [CRON] Đã gửi ${emailPromises.length} email thông báo`);
        }

        return { success: true, cancelled: cancelledCount };

    } catch (error: any) {
        console.error("❌ [CRON] Lỗi:", error.message);
        console.error("❌ [CRON] Stack:", error.stack);
        return { success: false, error: error.message };
    }
}

/**
 * Gửi email thông báo hủy đơn
 */
async function sendCancellationEmail(
    env: Env,
    data: { email: string; ho_ten: string; don_thue_id: number; ten_phuong_tien: string }
): Promise<void> {
    
    try {
        const config = await getAppConfig(env)
        const emailBody = {
            from: `${config.EMAIL?.FROM_NAME} <${config.EMAIL?.FROM_EMAIL}>`,
            to: 'khoatran3123@gmail.com',
            subject: `[HỦY ĐƠN] Đơn thuê phương tiện #${data.don_thue_id} đã bị hủy`,
            html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; border: 1px solid #cccccc; background-color: #ffffff;">
                    <tr>
                        <td align="center" bgcolor="#dc3545" style="padding: 20px 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ ĐƠN THUÊ ĐÃ BỊ HỦY</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin-top: 0;">Xin chào ${data.ho_ten},</h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                                Đơn thuê phương tiện <strong>#${data.don_thue_id}</strong> (${data.ten_phuong_tien}) của bạn đã bị 
                                <strong style="color: #dc3545;">tự động hủy</strong> do không thanh toán tiền cọc trong vòng 
                                <strong>60 phút</strong> sau khi được duyệt.
                            </p>
                            
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #856404; font-size: 15px;">
                                    <strong>💡 Lưu ý:</strong> Vui lòng thanh toán cọc ngay sau khi đơn được duyệt để giữ chỗ.
                                </p>
                            </div>

                            <p style="color: #555555; font-size: 15px; line-height: 1.5;">
                                Nếu bạn vẫn muốn thuê phương tiện, vui lòng đặt lại đơn mới. Chúng tôi rất tiếc vì sự bất tiện này.
                            </p>

                            <p style="text-align: center; margin-top: 30px;">
                                <a href="https://yourwebsite.com/cars" 
                                   style="background-color: #28a745; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                                    🚗 ĐẶT PHƯƠNG TIỆN MỚI
                                </a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f4f4" style="padding: 20px 30px; text-align: center; border-top: 1px solid #cccccc;">
                            <p style="margin: 0; color: #888888; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} ${config.EMAIL?.FROM_NAME}
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

        if (res.ok) {
            console.log(`  ✅ Email đã gửi tới ${data.email}`);
        } else {
            const errorText = await res.text();
            console.error(`  ❌ Lỗi gửi email tới ${data.email}:`, errorText);
        }
    } catch (error: any) {
        console.error(`  ❌ Exception gửi email:`, error.message);
    }
}
async function handleAutoRejectLevel3Orders(env: Env) {
    try {
        // Tìm các đơn CHO_DUYET > 60 phút của khách cấp 3
        const pendingOrders = await env.DB.prepare(`
            SELECT 
                dt.don_thue_id,
                dt.khach_hang_id,
                dt.phuong_tien_id,
                dt.ngay_tao,
                kh.ho_ten,
                nd.email,
                pt.ten_phuong_tien,
                CAST((julianday('now', '+7 hours') - julianday(dt.ngay_tao)) * 1440 AS INTEGER) as phut_da_qua
            FROM DonThue dt
            JOIN KhachHang kh ON dt.khach_hang_id = kh.khach_hang_id
            JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
            JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
            WHERE dt.trang_thai = 'CHO_DUYET'
              AND julianday('now', '+7 hours') - julianday(dt.ngay_tao) > (60.0 / 1440.0)
        `).all<{
            don_thue_id: number;
            khach_hang_id: number;
            phuong_tien_id: number;
            ngay_tao: string;
            ho_ten: string;
            email: string;
            ten_phuong_tien: string;
            phut_da_qua: number;
        }>();

        if (!pendingOrders.results || pendingOrders.results.length === 0) {
            console.log("✅ [CRON] Không có đơn chờ duyệt quá 60 phút");
            return { rejected: 0 };
        }

        console.log(`⚠️ [CRON] Tìm thấy ${pendingOrders.results.length} đơn chờ duyệt quá 60 phút`);

        let rejectedCount = 0;
        const emailPromises: Promise<void>[] = [];

        for (const order of pendingOrders.results) {
            // Check xem khách này có vi phạm cấp 3 không
            const violations = await env.DB.prepare(`
                SELECT * FROM ViPham
                WHERE khach_hang_id = ? AND trang_thai = 'chua_xu_ly'
            `).bind(order.khach_hang_id).all();

            const totalDebt = violations.results.reduce((sum: number, v: any) => sum + v.so_tien_phat, 0);
            const totalViolations = violations.results.length;

            // Chỉ tự động từ chối nếu CẤP 3
            if (totalDebt > 2000000 || totalViolations >= 3) {
                console.log(`  - Tự động từ chối đơn #${order.don_thue_id}: ${order.ho_ten} | Vi phạm: ${totalViolations} | Nợ: ${totalDebt}`);

                // Từ chối đơn
                await env.DB.batch([
                    env.DB.prepare(`
                        UPDATE DonThue 
                        SET trang_thai = 'TU_CHOI',
                            ghi_chu = '[HỆ THỐNG] Tự động từ chối sau 60p - Vi phạm cấp 3',
                            ngay_cap_nhat = datetime('now', '+7 hours')
                        WHERE don_thue_id = ?
                    `).bind(order.don_thue_id),

                    env.DB.prepare(`
                        UPDATE PhuongTien 
                        SET trang_thai = 'SAN_SANG' 
                        WHERE phuong_tien_id = ?
                    `).bind(order.phuong_tien_id)
                ]);

                rejectedCount++;

                // Gửi email
                if (env.RESEND_API_KEY && order.email) {
                    emailPromises.push(
                        sendAutoRejectEmail(env, {
                            email: order.email,
                            ho_ten: order.ho_ten,
                            don_thue_id: order.don_thue_id,
                            ten_phuong_tien: order.ten_phuong_tien,
                            total_debt: totalDebt,
                            violations: violations.results
                        })
                    );
                }
            }
        }

        if (rejectedCount > 0) {
            console.log(`✅ [CRON] Đã tự động từ chối ${rejectedCount} đơn cấp 3`);
        }

        if (emailPromises.length > 0) {
            await Promise.allSettled(emailPromises);
            console.log(`📧 [CRON] Đã gửi ${emailPromises.length} email thông báo`);
        }

        return { success: true, rejected: rejectedCount };

    } catch (error: any) {
        console.error("❌ [CRON] Lỗi:", error.message);
        return { success: false, error: error.message };
    }
}


async function sendAutoRejectEmail(
    env: Env,
    data: { 
        email: string; 
        ho_ten: string; 
        don_thue_id: number; 
        ten_phuong_tien: string;
        total_debt: number;
        violations: any[];
    }
): Promise<void> {
    try {
        const fmt = (t: number) => new Intl.NumberFormat('vi-VN').format(t) + ' đ';
        const config = await getAppConfig(env)
        const emailBody = {
            from: `${config.EMAIL?.FROM_NAME} <${config.EMAIL?.FROM_EMAIL}>`,
            to: 'khoatran3123@gmail.com',//data.email,
            subject: `❌ Đơn #${data.don_thue_id} tự động bị từ chối`,
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table align="center" width="600" style="margin: 20px auto; border: 1px solid #ccc; background: #fff;">
                        <tr>
                            <td align="center" bgcolor="#dc3545" style="padding: 20px;">
                                <h1 style="color: #fff; margin: 0;">🚫 ĐƠN TỰ ĐỘNG BỊ TỪ CHỐI</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #333;">Xin chào ${data.ho_ten},</h2>
                                
                                <div style="background: #ffebee; padding: 20px; border-left: 5px solid #dc3545; margin: 20px 0; border-radius: 8px;">
                                    <h3 style="color: #c62828; margin-top: 0;">⏰ TỰ ĐỘNG TỪ CHỐI</h3>
                                    <p style="font-size: 16px;">
                                        Đơn thuê phương tiện <strong>#${data.don_thue_id}</strong> (${data.ten_phuong_tien}) 
                                        đã bị <strong style="color: #dc3545;">TỰ ĐỘNG TỪ CHỐI</strong> do:
                                    </p>
                                    <ul style="line-height: 1.8; font-size: 15px;">
                                        <li>Bạn có vi phạm nghiêm trọng chưa xử lý</li>
                                        <li>Đơn chờ duyệt quá 60 phút</li>
                                    </ul>
                                    <p style="font-size: 16px; margin-top: 15px;">
                                        Tổng nợ vi phạm: <strong style="color: #dc3545; font-size: 22px;">${fmt(data.total_debt)}</strong>
                                    </p>
                                </div>
                                
                                <h3 style="border-bottom: 2px solid #dc3545; padding-bottom: 10px;">📋 Danh sách vi phạm</h3>
                                <table width="100%" style="border-collapse: collapse; margin: 20px 0;">
                                    ${data.violations.map((v: any) => `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 12px;">
                                                <strong>${v.loai_vi_pham}</strong><br>
                                                <small style="color: #888;">${new Date(v.thoi_gian_xay_ra).toLocaleDateString('vi-VN')}</small>
                                            </td>
                                            <td style="padding: 12px; text-align: right; font-weight: bold; color: #dc3545;">
                                                ${fmt(v.so_tien_phat)}
                                            </td>
                                        </tr>
                                    `).join('')}
                                    <tr style="background: #ffebee;">
                                        <td style="padding: 15px; font-weight: bold;">TỔNG NỢ</td>
                                        <td style="padding: 15px; text-align: right; color: #dc3545; font-size: 22px; font-weight: bold;">
                                            ${fmt(data.total_debt)}
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0;">
                                    <h3 style="margin-top: 0; color: #856404;">💡 Để tiếp tục thuê phương tiện</h3>
                                    <ol style="line-height: 2; font-size: 15px;">
                                        <li>Thanh toán <strong>TOÀN BỘ ${fmt(data.total_debt)}</strong></li>
                                        <li>Liên hệ hotline: <strong>${config.CONTACT.HOTLINE}</strong></li>
                                        <li>Sau xác nhận, bạn có thể đặt đơn mới</li>
                                    </ol>
                                </div>
                                
                                <p style="text-align: center; margin-top: 30px;">
                                    <a href="tel:${config.CONTACT.HOTLINE}" style="background: #dc3545; color: white; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                        📞 Liên hệ: ${config.CONTACT.HOTLINE}
                                    </a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailBody)
        });

        if (res.ok) {
            console.log(`  ✅ Email đã gửi tới ${data.email}`);
        } else {
            const errorText = await res.text();
            console.error(`  ❌ Lỗi gửi email:`, errorText);
        }
    } catch (error: any) {
        console.error(`  ❌ Exception gửi email:`, error.message);
    }
}

    async function sendOverdueEmail(
    env: Env,
    customer: OverdueNotification,
    config: any
    ): Promise<boolean> {
    const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
        }).format(amount);

    const severity = customer.so_ngay_qua_han >= 7 ? 'NGHIÊM TRỌNG' 
        : customer.so_ngay_qua_han >= 3 ? 'CẢNH BÁO' 
        : 'NHẮC NHỞ';
    const startDate = new Date (customer.ngay_bat_dau)
    const deadlineDate = new Date(customer.ngay_ket_thuc);
    const currentDate = new Date();
    const overdueMs = currentDate.getTime() - deadlineDate.getTime();
    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
    const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table align="center" width="600" style="border-collapse: collapse; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <tr>
            <td align="center" bgcolor="#dc3545" style="padding: 30px 20px;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">⚠️ THÔNG BÁO QUÁ HẠN TRẢ XE</h1>
            </td>
            </tr>
            
            <!-- Body -->
            <tr>
            <td style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                Kính gửi <strong>${customer.ho_ten}</strong>,
                </p>
                
                <!-- Alert Box -->
                <div style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">🚨 ${severity}</h3>
                <p style="margin: 0; font-size: 15px; color: #856404;">
                    Đơn thuê xe <strong>#${customer.don_thue_id}</strong> đã 
                    <strong style="color: #dc3545;">quá hạn ${customer.so_ngay_qua_han} ngày ${customer.so_gio_le} giờ</strong>.
                </p>
                </div>
                
                <!-- Thông tin đơn hàng -->
                <h3 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 30px;">📋 Thông tin đơn hàng</h3>
                <table width="100%" style="border-collapse: collapse; margin: 15px 0;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;">Phương tiện</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #333;">
                    ${customer.ten_phuong_tien}<br>
                    <span style="font-size: 13px; color: #888;">${customer.bien_so}</span>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;">Hạn trả</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #333;">
                    ${deadlineDate.toLocaleString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #eee; background: #fff3cd;">
                    <td style="padding: 12px 0; color: #666; font-weight: bold;">⏰ Thời điểm hiện tại</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #333;">
                    ${currentDate.toLocaleString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;">Thời gian quá hạn</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #dc3545; font-size: 16px;">
                    ${customer.so_ngay_qua_han} ngày ${customer.so_gio_le} giờ
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #666; font-weight: bold;">Phí trễ hạn</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #dc3545; font-size: 18px;">
                    ${formatCurrency(customer.phi_tre_han)}
                    </td>
                </tr>
                </table>
                
                <!-- Chi tiết phí -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.8;">
                    <strong>💰 Cách tính phí trễ hạn:</strong><br>
                    • Số ngày: ${customer.so_ngay_qua_han} ngày × 400.000đ = ${formatCurrency(customer.so_ngay_qua_han * 400000)}<br>
                    • Số giờ lẻ: ${customer.so_gio_le} giờ × 5.000đ = ${formatCurrency(customer.so_gio_le * 5000)}<br>
                    <strong style="color: #dc3545; font-size: 15px;">Tổng cộng: ${formatCurrency(customer.phi_tre_han)}</strong>
                </p>
                </div>
                
                <!-- Timeline -->
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 16px;">📅 Dòng thời gian</h3>
                <div style="border-left: 3px solid #2196f3; padding-left: 15px; margin-left: 10px;">
                    <div style="margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 13px; color: #888;">Thời điểm thuê</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #333; font-weight: 600;">
                         📅 ${startDate.toLocaleString('vi-VN', { 
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                        })}
                    </p>
                    </div>
                    <div style="margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 13px; color: #888;">Hạn trả xe</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #333; font-weight: 600;">
                        📅 ${deadlineDate.toLocaleString('vi-VN', { 
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                        })}
                    </p>
                    </div>
                    <div style="background: #ffebee; padding: 10px; border-radius: 5px;">
                    <p style="margin: 0; font-size: 13px; color: #c62828;">Hiện tại (quá hạn)</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #c62828; font-weight: bold;">
                        ⚠️ ${currentDate.toLocaleString('vi-VN', { 
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                        })}<br>
                        <span style="font-size: 16px;">→ Quá hạn: ${customer.so_ngay_qua_han} ngày ${customer.so_gio_le} giờ</span>
                    </p>
                    </div>
                </div>
                </div>
                
                <!-- Hướng dẫn -->
                <div style="background: #e8f5e9; border-left: 5px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px;">📍 Vui lòng thực hiện NGAY</h3>
                <ol style="margin: 0; padding-left: 20px; color: #2e7d32; line-height: 2;">
                    <li>Liên hệ hotline <strong>${config.CONTACT?.HOTLINE || '0123 456 789'}</strong> để xác nhận</li>
                    <li>Mang xe đến địa điểm trả theo hợp đồng</li>
                    <li>Thanh toán phí trễ hạn: <strong>${formatCurrency(customer.phi_tre_han)}</strong></li>
                    <li>Ký biên bản bàn giao xe hoàn tất</li>
                </ol>
                </div>
                
                ${customer.so_ngay_qua_han >= 7 ? `
                <div style="background: #ffebee; border: 2px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #c62828; font-weight: bold; font-size: 15px;">
                    🚨 CẢNH BÁO NGHIÊM TRỌNG: Quá hạn trên 7 ngày<br>
                    Chúng tôi có thể báo cáo cơ quan chức năng và khởi kiện theo pháp luật
                </p>
                </div>
                ` : ''}
                
                <!-- CTA Button -->
                <p style="text-align: center; margin: 30px 0;">
                <a href="tel:${config.CONTACT?.HOTLINE || '0123456789'}" 
                    style="display: inline-block; background: #dc3545; color: #fff; 
                            padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                            font-weight: bold; font-size: 16px;">
                    📞 Gọi ngay: ${config.CONTACT?.HOTLINE || '0123 456 789'}
                </a>
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                Chúng tôi hiểu có thể có những tình huống bất khả kháng. 
                Vui lòng liên hệ ngay để được hỗ trợ tốt nhất.
                </p>
                
                <!-- Thông tin liên hệ -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 30px; font-size: 13px; color: #666;">
                <p style="margin: 0;">
                    <strong>📧 Email gốc:</strong> ${customer.email}<br>
                    <strong>📱 SĐT:</strong> ${customer.so_dien_thoai}
                </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Trân trọng,<br>
                <strong>Đội ngũ hỗ trợ khách hàng</strong>
                </p>
            </td>
            </tr>
            
            <!-- Footer -->
            <tr>
            <td bgcolor="#f9fafb" style="padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Email này được gửi tự động. Vui lòng không trả lời email này.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${config.EMAIL?.FROM_NAME}. All rights reserved.
                </p>
            </td>
            </tr>
        </table>
        </body>
        </html>
    `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `${config.EMAIL?.FROM_NAME} <${config.EMAIL?.FROM_EMAIL}>`,
            to: ['khoatran3123@gmail.com'],
            subject: `⚠️ [QUÁ HẠN ${customer.so_ngay_qua_han} NGÀY] Đơn #${customer.don_thue_id} - ${customer.ho_ten}`,
            html: emailHtml,
        }),
        });

        if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email error: ${errorText}`);
        }

        console.log(`  ✅ Email OK: ${customer.ho_ten} (${customer.email})`);
        return true;
    } catch (error: any) {
        console.error(`  ❌ Lỗi email ${customer.email}:`, error.message);
        return false;
    }
}


async function sendOverdueNotifications(env: Env): Promise<{ sent: number; total: number }> {
  try {
    const config = await getAppConfig(env);

    const result = await env.DB.prepare(`
      SELECT 
        dt.don_thue_id,
        nd.ho_ten,
        nd.email,
        nd.so_dien_thoai,
        pt.ten_phuong_tien,
        pt.bien_so,
        dt.ngay_ket_thuc,
        dt.ngay_bat_dau,
        dt.tong_tien,
        
        CAST((julianday(datetime('now', 'localtime')) - julianday(datetime(dt.ngay_ket_thuc, 'localtime'))) AS INTEGER) as so_ngay_qua_han,
        
        CAST(
          ((julianday(datetime('now', 'localtime')) - julianday(datetime(dt.ngay_ket_thuc, 'localtime'))) * 24) 
          - (CAST((julianday(datetime('now', 'localtime')) - julianday(datetime(dt.ngay_ket_thuc, 'localtime'))) AS INTEGER) * 24)
        AS INTEGER) as so_gio_le,
        
        (CAST((julianday(datetime('now', 'localtime')) - julianday(datetime(dt.ngay_ket_thuc, 'localtime'))) AS INTEGER) * 400000) + 
        (CAST(
          ((julianday(datetime('now', 'localtime')) - julianday(datetime(dt.ngay_ket_thuc, 'localtime'))) * 24) 
          - (CAST((julianday(datetime('now', 'localtime')) - julianday(datetime(dt.ngay_ket_thuc, 'localtime'))) AS INTEGER) * 24)
        AS INTEGER) * 5000) 
        as phi_tre_han
        
      FROM DonThue dt
      JOIN NguoiDung nd ON dt.khach_hang_id = nd.nguoi_dung_id
      JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
      WHERE 
        dt.trang_thai = 'DANG_THUE'
        AND dt.ngay_tra_thuc_te IS NULL
        AND datetime(dt.ngay_ket_thuc, 'localtime') < datetime('now', 'localtime')
      ORDER BY so_ngay_qua_han DESC
    `).all();

    const overdueOrders = result.results as unknown as OverdueNotification[];

    if (overdueOrders.length === 0) {
      console.log('✅ [EMAIL] Không có đơn quá hạn');
      return { sent: 0, total: 0 };
    }

    console.log(`📧 [EMAIL] Tìm thấy ${overdueOrders.length} đơn quá hạn`);

    overdueOrders.forEach(order => {
      console.log(`  - Đơn #${order.don_thue_id}: ${order.ho_ten}`);
      console.log(`    Hạn trả: ${order.ngay_ket_thuc}`);
      console.log(`    Quá hạn: ${order.so_ngay_qua_han} ngày ${order.so_gio_le} giờ`);
      console.log(`    Phí: ${order.phi_tre_han.toLocaleString('vi-VN')}đ`);
    });

    const promises = overdueOrders.map(order => 
      sendOverdueEmail(env, order, config)
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    console.log(`✅ [EMAIL] Đã gửi ${successCount}/${overdueOrders.length} email`);

    return { sent: successCount, total: overdueOrders.length };
  } catch (error: any) {
    console.error('❌ [EMAIL] Lỗi:', error.message);
    return { sent: 0, total: 0 };
  }
}