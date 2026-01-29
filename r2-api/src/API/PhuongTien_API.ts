interface Env {
    DB: D1Database;
}

// Danh sách tất cả các cột hợp lệ trong bảng PhuongTien để xác thực
const ALL_COLUMNS = [
    'phuong_tien_id',
    'ten_phuong_tien',
    'loai',
    'danh_muc_id',
    'trang_thai',
    'bien_so',
    'so_km',
    'chinh_sach_id',
    'so_khung',
    'ngay_tao',
    'ngay_cap_nhat',
    'img',
    'gia_thue',
    'model'
];

/**
 * Hàm helper để trả về phản hồi JSON với các header CORS mặc định
 */
const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Cho phép truy cập từ mọi nguồn
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * Xử lý yêu cầu GET để lấy dữ liệu từ bảng PhuongTien.
 * Cho phép tùy chọn các cột cần lấy thông qua query parameter 'fields'.
 */
export async function handleGetPhuongTien(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const fieldsParam = url.searchParams.get('fields');
    const danh_muc_id = url.searchParams.get('danh_muc_id');
    const trang_thai = url.searchParams.get('trang_thai');

    let columnsToSelect = '*'; // Mặc định lấy tất cả các cột

    // Nếu có tham số 'fields', xử lý để chỉ lấy các cột được yêu cầu
    if (fieldsParam) {
        const requestedFields = fieldsParam.split(',').map(f => f.trim());

        // Lọc ra các cột hợp lệ để tránh SQL injection
        const validFields = requestedFields.filter(field => ALL_COLUMNS.includes(field));

        if (validFields.length > 0) {
            columnsToSelect = validFields.join(', ');
        } else {
            // Nếu không có cột hợp lệ nào được cung cấp, trả về lỗi
            return jsonResponse({
                success: false,
                error: "Các cột bạn yêu cầu không hợp lệ. Các cột hợp lệ là: " + ALL_COLUMNS.join(', '),
            }, 400);
        }
    }

    let query = `SELECT ${columnsToSelect} FROM PhuongTien`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (danh_muc_id) {
        conditions.push("danh_muc_id = ?");
        // Ensure decimal request is safe
        params.push(Number(danh_muc_id));
    }

    if (trang_thai) {
        conditions.push("trang_thai = ?");
        params.push(trang_thai);
    }

    // Tìm kiếm theo tên phương tiện
    const search = url.searchParams.get('search');
    if (search) {
        conditions.push("ten_phuong_tien LIKE ?");
        params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    // Debug log (remove in production if needed)
    console.log("Executing Query:", query);
    console.log("Params:", params);

    try {
        const stmt = env.DB.prepare(query).bind(...params);
        const { results } = await stmt.all();
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