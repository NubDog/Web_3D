export interface Env {
    DB: D1Database;
    hd: R2Bucket; 
    RESEND_API_KEY: string; 
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

    return json({ ok: false, error: "Not found" }, 404);
  },

};
export async function handleScheduled(
    event: ScheduledEvent, 
    env: Env, 
    ctx: ExecutionContext
): Promise<void> {
    console.log("🕐 [CRON] Bắt đầu kiểm tra đơn quá hạn cọc...");
    const nowUTC = new Date(event.scheduledTime);
    const nowVN = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
    console.log('🕐 [CRON] Thời gian UTC:', nowUTC.toISOString());
    console.log('🕐 [CRON] Thời gian VN (GMT+7):', nowVN.toISOString());
    console.log('🕐 [CRON] Thời gian VN (readable):', nowVN.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
    // console.log("🕐 [CRON] Trigger time:", new Date(event.scheduledTime).toISOString());

    ctx.waitUntil(handleExpiredDeposits(env));
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
            console.log(`  - Đơn #${order.don_thue_id}: ${order.ho_ten} | Xe: ${order.ten_phuong_tien} | Quá: ${order.phut_da_qua} phút`);

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
        const emailBody = {
            from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
            to: 'khoatran3123@gmail.com',
            subject: `[HỦY ĐƠN] Đơn thuê xe #${data.don_thue_id} đã bị hủy`,
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
                                Đơn thuê xe <strong>#${data.don_thue_id}</strong> (${data.ten_phuong_tien}) của bạn đã bị 
                                <strong style="color: #dc3545;">tự động hủy</strong> do không thanh toán tiền cọc trong vòng 
                                <strong>60 phút</strong> sau khi được duyệt.
                            </p>
                            
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #856404; font-size: 15px;">
                                    <strong>💡 Lưu ý:</strong> Vui lòng thanh toán cọc ngay sau khi đơn được duyệt để giữ chỗ.
                                </p>
                            </div>

                            <p style="color: #555555; font-size: 15px; line-height: 1.5;">
                                Nếu bạn vẫn muốn thuê xe, vui lòng đặt lại đơn mới. Chúng tôi rất tiếc vì sự bất tiện này.
                            </p>

                            <p style="text-align: center; margin-top: 30px;">
                                <a href="https://yourwebsite.com/cars" 
                                   style="background-color: #28a745; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                                    🚗 ĐẶT XE MỚI
                                </a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f4f4" style="padding: 20px 30px; text-align: center; border-top: 1px solid #cccccc;">
                            <p style="margin: 0; color: #888888; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Dịch vụ cho thuê đa phương tiện
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
