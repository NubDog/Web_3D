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
 * Xử lý yêu cầu GET để lấy dữ liệu người dùng với đầy đủ thông tin
 * Bao gồm cả avatar từ bảng KhachHang
 */
export async function handleGetKhachHang(request: Request, env: Env): Promise<Response> {
    try {
        const query = `
            SELECT 
                kh.khach_hang_id,
                kh.nguoi_dung_id,
                nd.ten_dang_nhap,
                nd.mat_khau,
                nd.vai_tro,
                nd.trang_thai,
                kh.ho_ten,
                nd.email,
                nd.so_dien_thoai,
                kh.ngay_sinh,
                kh.dia_chi,
                kh.thanh_pho,
                kh.tinh,
                kh.ma_buu_chinh,
                kh.quoc_gia,
                kh.ngay_tao,
                kh.ngay_cap_nhat,
                kh.avatar as img
            FROM KhachHang kh
            LEFT JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
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
