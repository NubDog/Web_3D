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
}

export const handleConfirmDeposit = async (request: Request, env: Env, orderId: string) => {
    try {
        
        const orderInfo = await env.DB.prepare(
            `SELECT khach_hang_id, ghi_chu, tong_tien FROM DonThue WHERE don_thue_id = ?`
        ).bind(orderId).first<{ khach_hang_id: number, ghi_chu: string, tong_tien: number }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn hàng." }, 404);
        }

        if (orderInfo.ghi_chu && orderInfo.ghi_chu.includes('[CONDITION: PAY_FIRST]')) {
            const violations = await env.DB.prepare(
                `SELECT SUM(so_tien_phat) as total_debt, COUNT(*) as count
                 FROM ViPham 
                 WHERE khach_hang_id = ? AND trang_thai = 'chua_xu_ly'`
            ).bind(orderInfo.khach_hang_id).first<{ total_debt: number, count: number }>();

            if (violations && violations.count > 0) {
                const LIMIT_DEBT = 1000000; 
                const LIMIT_COUNT = 2;      

                if (violations.total_debt >= LIMIT_DEBT || violations.count >= LIMIT_COUNT) {
                    return jsonResponse({ 
                        success: false, 
                        error: `⛔ CHẶN CỌC: Khách nợ ${new Intl.NumberFormat('vi-VN').format(violations.total_debt)}đ hoặc có ${violations.count} vi phạm (Vượt mức cho phép)!`,
                        blocked_reason: 'UNPAID_VIOLATIONS', 
                        violations_count: violations.count,
                        total_debt: violations.total_debt || 0
                    }, 403); 
                }
            }
        }

        const stmt = env.DB.prepare(
            `UPDATE TienCoc
             SET trang_thai = 'DANG_GIU', phuong_thuc = 'TIEN_MAT', ngay_giu = datetime('now', '+7 hours')
             WHERE don_thue_id = ? AND trang_thai = 'CHO_THANH_TOAN'`
        );
        
        const result = await stmt.bind(orderId).run();
        
        const stmt2 = env.DB.prepare(
            `UPDATE HopDong
             SET trang_thai = 'DA_KY', 
                 noi_dung_dieu_khoan = 'DA_XAC_NHAN_COC', -- Tôi sửa nhẹ chỗ này cho lịch sự hơn chút nhé :D
                 ngay_cap_nhat = datetime('now', '+7 hours')
             WHERE don_thue_id = ? AND trang_thai = 'CHO_KY'`
        );

        const result2 = await stmt2.bind(orderId).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ 
                success: false, 
                error: "Không tìm thấy bản ghi cọc 'CHO_THANH_TOAN' hoặc đã xác nhận rồi." 
            }, 404);
        }
        
        if (result2.meta.changes === 0) {
             console.warn("Cảnh báo: Không update được trạng thái hợp đồng (có thể đã ký rồi)");
        }

        return jsonResponse({ success: true, message: "Xác nhận tiền cọc thành công." });

    } catch (e: any) {
        console.error("API Error in handleConfirmDeposit:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};