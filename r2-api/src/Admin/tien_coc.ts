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

        const stmt = env.DB.prepare(
            `UPDATE TienCoc
             SET trang_thai = 'DANG_GIU', phuong_thuc = 'TIEN_MAT', ngay_giu = CURRENT_TIMESTAMP
             WHERE don_thue_id = ? AND trang_thai = 'CHO_THANH_TOAN'`
        );
        
        const result = await stmt.bind(orderId).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ 
                success: false, 
                error: "Không tìm thấy bản ghi cọc ở trạng thái 'CHO_THANH_TOAN' để cập nhật, hoặc đã được xác nhận trước đó." 
            }, 404);
        }

        return jsonResponse({ success: true, message: "Xác nhận tiền cọc thành công." });

    } catch (e: any) {
        console.error("API Error in handleConfirmDeposit:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};
