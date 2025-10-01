interface Env {
    DB: D1Database;
}

/**
 * Hàm helper để trả về phản hồi JSON với các header CORS mặc định
 */
const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * Xử lý yêu cầu GET để lấy dữ liệu từ bảng KhachHang
 * CHỈ lấy các cột trong bảng KhachHang
 */
export async function handleGetKhachHang(request: Request, env: Env): Promise<Response> {
    try {
        const query = `
            SELECT 
                khach_hang_id,
                nguoi_dung_id,
                ho_ten,
                ngay_sinh,
                dia_chi,
                thanh_pho,
                tinh,
                ma_buu_chinh,
                quoc_gia,
                ngay_tao,
                ngay_cap_nhat,
                avatar,
                avatar as img
            FROM KhachHang
        `;

        const { results } = await env.DB.prepare(query).all();
        
        return jsonResponse({
            success: true,
            data: results,
        });
    } catch (e: any) {
        return jsonResponse({
            success: false,
            error: 'Lỗi truy vấn cơ sở dữ liệu.',
            details: e.message,
        }, 500);
    }
}
