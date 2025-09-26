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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * API lấy thông tin đơn thuê của user đang đăng nhập
 * Cần truyền nguoi_dung_id qua query parameter: ?nguoi_dung_id=123
 */
export async function handleGetUserOrders(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const nguoiDungId = url.searchParams.get('nguoi_dung_id');

    // Kiểm tra xem có nguoi_dung_id không
    if (!nguoiDungId) {
        return jsonResponse({
            success: false,
            error: 'Thiếu thông tin nguoi_dung_id. Vui lòng đăng nhập.',
        }, 400);
    }

    console.log(nguoiDungId);

    try {
        // Bước 1: Lấy khach_hang_id từ bảng KhachHang dựa trên nguoi_dung_id
        const khachHangQuery = `SELECT khach_hang_id FROM KhachHang WHERE nguoi_dung_id = ?`;
        const khachHangResult = await env.DB.prepare(khachHangQuery).bind(nguoiDungId).first();

        if (!khachHangResult) {
            return jsonResponse({
                success: false,
                error: 'Không tìm thấy thông tin khách hàng.',
            }, 404);
        }

        const khachHangId = khachHangResult.khach_hang_id;

        // Bước 2: Lấy thông tin đơn thuê từ bảng DonThue
        const donThueQuery = `
            SELECT 
                don_thue_id,
                khach_hang_id,
                phuong_tien_id,
                chinh_sach_id,
                nhan_vien_tao,
                ngay_bat_dau,
                ngay_ket_thuc,
                dia_diem_nhan,
                dia_diem_tra,
                trang_thai,
                tong_tien,
                tien_coc_yeu_cau,
                ghi_chu,
                ngay_tao,
                ngay_cap_nhat
            FROM DonThue 
            WHERE khach_hang_id = ?
            ORDER BY ngay_tao DESC
        `;

        const { results } = await env.DB.prepare(donThueQuery).bind(khachHangId).all();

        return jsonResponse({
            success: true,
            data: results,
            message: `Lấy thành công ${results.length} đơn thuê.`,
        });

    } catch (e: any) {
        return jsonResponse({
            success: false,
            error: 'Lỗi truy vấn cơ sở dữ liệu.',
            details: e.message,
        }, 500);
    }
}
