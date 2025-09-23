interface Env {
    DB: D1Database;
}

// Danh sách tất cả các cột hợp lệ trong bảng NguoiDung để xác thực
const ALL_COLUMNS = [
    'nguoi_dung_id',
    'ten_dang_nhap',
    'mat_khau',
    'vai_tro',
    'trang_thai',
    'ho_ten',
    'email',
    'so_dien_thoai',
    'ngay_tao',
    'ngay_cap_nhat'
];

/**
 * Hàm helper để trả về phản hồi JSON với các header CORS mặc định
 */
const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Cho phép truy cập từ mọi nguồn
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * Xử lý yêu cầu GET để lấy dữ liệu từ bảng NguoiDung.
 * Cho phép tùy chọn các cột cần lấy thông qua query parameter 'fields'.
 */
export async function handleGetNguoiDung(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const fieldsParam = url.searchParams.get('fields');

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

    const query = `SELECT ${columnsToSelect} FROM NguoiDung`;

    try {
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

/**
 * Xử lý yêu cầu POST để tạo một người dùng mới.
 */
export async function handleCreateNguoiDung(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }

    try {
        const newUser: any = await request.json();

        // Xác thực các trường bắt buộc
        const requiredFields = ['ten_dang_nhap', 'mat_khau', 'ho_ten', 'email', 'so_dien_thoai'];
        for (const field of requiredFields) {
            if (!newUser[field]) {
                return jsonResponse({ success: false, error: `Trường '${field}' là bắt buộc.` }, 400);
            }
        }

        const query = `
            INSERT INTO NguoiDung (
                ten_dang_nhap, mat_khau, vai_tro, trang_thai, ho_ten, email, so_dien_thoai, ngay_tao, ngay_cap_nhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        
        const vai_tro = newUser.vai_tro || 'khach_hang';
        const trang_thai = newUser.trang_thai || 'hoat_dong';

        const ps = env.DB.prepare(query).bind(
            newUser.ten_dang_nhap,
            newUser.mat_khau,
            vai_tro,
            trang_thai,
            newUser.ho_ten,
            newUser.email,
            newUser.so_dien_thoai
        );

        const { results } = await ps.all();
        const createdUser = results.length > 0 ? results[0] : null;

        return jsonResponse({
            success: true,
            message: 'Người dùng đã được tạo thành công.',
            data: createdUser,
        }, 201);

    } catch (e: any) {
        if (e instanceof SyntaxError) {
             return jsonResponse({ success: false, error: 'Request body không phải là JSON hợp lệ.' }, 400);
        }
        if (e.message && e.message.includes('UNIQUE constraint failed')) {
            return jsonResponse({ success: false, error: 'Tên đăng nhập hoặc email đã tồn tại.' }, 409);
        }
        return jsonResponse({
            success: false,
            error: 'Lỗi khi tạo người dùng.',
            details: e.message,
        }, 500);
    }
}
