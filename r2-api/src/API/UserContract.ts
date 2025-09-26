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
 * API lấy thông tin hợp đồng của user đang đăng nhập
 * Cần truyền nguoi_dung_id qua query parameter: ?nguoi_dung_id=123
 */
export async function handleGetUserContract(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const nguoiDungId = url.searchParams.get('nguoi_dung_id');

    // Kiểm tra xem có nguoi_dung_id không
    if (!nguoiDungId) {
        return jsonResponse({
            success: false,
            error: 'Thiếu thông tin nguoi_dung_id. Vui lòng đăng nhập.',
        }, 400);
    }

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

        // Bước 2: Lấy tất cả don_thue_id từ bảng DonThue dựa vào khach_hang_id
        const donThueQuery = `SELECT don_thue_id FROM DonThue WHERE khach_hang_id = ?`;
        const { results: donThueResults } = await env.DB.prepare(donThueQuery).bind(khachHangId).all();

        if (!donThueResults || donThueResults.length === 0) {
            return jsonResponse({
                success: true,
                data: [],
                message: 'Người dùng chưa có đơn thuê nào.',
            });
        }

        // Lấy danh sách don_thue_id
        const donThueIds = donThueResults.map((row: any) => row.don_thue_id);

        // Bước 3: Lấy thông tin hợp đồng từ bảng HopDong dựa vào các don_thue_id
        // Tạo placeholder cho IN clause
        const placeholders = donThueIds.map(() => '?').join(', ');
        
        const hopDongQuery = `
            SELECT 
                hop_dong_id,
                don_thue_id,
                so_hop_dong,
                ngay_ky,
                nhan_vien_ky,
                khach_hang_ky,
                duong_dan_file,
                noi_dung_dieu_khoan,
                trang_thai,
                ngay_tao,
                ngay_cap_nhat
            FROM HopDong 
            WHERE don_thue_id IN (${placeholders})
            ORDER BY ngay_tao DESC
        `;

        const { results: hopDongResults } = await env.DB.prepare(hopDongQuery).bind(...donThueIds).all();

        return jsonResponse({
            success: true,
            data: hopDongResults,
            message: `Lấy thành công ${hopDongResults.length} hợp đồng từ ${donThueIds.length} đơn thuê.`,
            summary: {
                total_don_thue: donThueIds.length,
                total_hop_dong: hopDongResults.length,
                khach_hang_id: khachHangId
            }
        });

    } catch (e: any) {
        return jsonResponse({
            success: false,
            error: 'Lỗi truy vấn cơ sở dữ liệu.',
            details: e.message,
        }, 500);
    }
}
