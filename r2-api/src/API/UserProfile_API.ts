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

// Các cột có thể cập nhật (không bao gồm các cột readonly)
const UPDATABLE_COLUMNS = [
    'ho_ten',
    'email',
    'so_dien_thoai'
];

/**
 * Hàm helper để trả về phản hồi JSON với các header CORS mặc định
 */
const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * Xử lý yêu cầu GET để lấy thông tin profile của người dùng theo ID
 */
export async function handleGetUserProfile(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('nguoi_dung_id');

    if (!userId) {
        return jsonResponse({
            success: false,
            error: 'Thiếu thông tin nguoi_dung_id',
        }, 400);
    }

    // Lấy tất cả thông tin trừ mật khẩu
    const query = `SELECT nguoi_dung_id, ten_dang_nhap, vai_tro, trang_thai, ho_ten, email, so_dien_thoai, ngay_tao, ngay_cap_nhat FROM NguoiDung WHERE nguoi_dung_id = ?`;

    try {
        const user = await env.DB.prepare(query).bind(userId).first();
        
        if (!user) {
            return jsonResponse({
                success: false,
                error: 'Không tìm thấy người dùng',
            }, 404);
        }

        return jsonResponse({
            success: true,
            data: user,
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
 * Xử lý yêu cầu PUT để cập nhật thông tin profile của người dùng
 */
export async function handleUpdateUserProfile(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId || isNaN(Number(userId))) {
        return jsonResponse({
            success: false,
            error: 'ID người dùng không hợp lệ',
        }, 400);
    }

    try {
        const body = await request.json() as Record<string, any>;

        // Validation cơ bản
        if (!body.ho_ten || !body.email || !body.so_dien_thoai) {
            return jsonResponse({
                success: false,
                error: 'Thiếu thông tin bắt buộc: ho_ten, email, so_dien_thoai',
            }, 400);
        }

        // Validation email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return jsonResponse({
                success: false,
                error: 'Email không đúng định dạng',
            }, 400);
        }

        // Validation số điện thoại (10 chữ số)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(body.so_dien_thoai)) {
            return jsonResponse({
                success: false,
                error: 'Số điện thoại phải có đúng 10 chữ số',
            }, 400);
        }

        // Kiểm tra email và số điện thoại đã tồn tại (trừ user hiện tại)
        const checks = [
            { column: 'email', value: body.email, error: 'Email đã được sử dụng bởi người dùng khác' },
            { column: 'so_dien_thoai', value: body.so_dien_thoai, error: 'Số điện thoại đã được sử dụng bởi người dùng khác' },
        ];

        for (const check of checks) {
            const existing = await env.DB.prepare(
                `SELECT nguoi_dung_id FROM NguoiDung WHERE ${check.column} = ? AND nguoi_dung_id != ?`
            ).bind(check.value, userId).first();
            
            if (existing) {
                return jsonResponse({
                    success: false,
                    error: check.error,
                }, 409);
            }
        }

        // Cập nhật thông tin
        const query = `
            UPDATE NguoiDung 
            SET ho_ten = ?, email = ?, so_dien_thoai = ?, ngay_cap_nhat = CURRENT_TIMESTAMP 
            WHERE nguoi_dung_id = ?
        `;

        const result = await env.DB.prepare(query)
            .bind(body.ho_ten, body.email, body.so_dien_thoai, userId)
            .run();

        if (result.meta.changes === 0) {
            return jsonResponse({
                success: false,
                error: 'Không tìm thấy người dùng để cập nhật',
            }, 404);
        }

        return jsonResponse({
            success: true,
            message: 'Cập nhật thông tin thành công',
        });

    } catch (e: any) {
        if (e instanceof SyntaxError) {
            return jsonResponse({
                success: false,
                error: 'Dữ liệu JSON không hợp lệ',
            }, 400);
        }
        
        return jsonResponse({
            success: false,
            error: 'Lỗi khi cập nhật thông tin người dùng.',
            details: e.message,
        }, 500);
    }
}

/**
 * Xử lý yêu cầu PUT để đổi mật khẩu
 */
export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as {
            nguoi_dung_id: number;
            old_password: string;
            new_password: string;
        };

        if (!body.nguoi_dung_id || !body.old_password || !body.new_password) {
            return jsonResponse({
                success: false,
                error: 'Thiếu thông tin: nguoi_dung_id, old_password, new_password',
            }, 400);
        }

        // Validation mật khẩu mới (ít nhất 6 ký tự)
        if (body.new_password.length < 6) {
            return jsonResponse({
                success: false,
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự',
            }, 400);
        }

        // Kiểm tra mật khẩu cũ
        const user = await env.DB.prepare(
            'SELECT mat_khau FROM NguoiDung WHERE nguoi_dung_id = ?'
        ).bind(body.nguoi_dung_id).first() as { mat_khau: string } | null;

        if (!user) {
            return jsonResponse({
                success: false,
                error: 'Không tìm thấy người dùng',
            }, 404);
        }

        if (user.mat_khau !== body.old_password) {
            return jsonResponse({
                success: false,
                error: 'Mật khẩu cũ không chính xác',
            }, 401);
        }

        // Cập nhật mật khẩu mới
        const result = await env.DB.prepare(
            'UPDATE NguoiDung SET mat_khau = ?, ngay_cap_nhat = CURRENT_TIMESTAMP WHERE nguoi_dung_id = ?'
        ).bind(body.new_password, body.nguoi_dung_id).run();

        if (result.meta.changes === 0) {
            return jsonResponse({
                success: false,
                error: 'Không thể cập nhật mật khẩu',
            }, 500);
        }

        return jsonResponse({
            success: true,
            message: 'Đổi mật khẩu thành công',
        });

    } catch (e: any) {
        if (e instanceof SyntaxError) {
            return jsonResponse({
                success: false,
                error: 'Dữ liệu JSON không hợp lệ',
            }, 400);
        }
        
        return jsonResponse({
            success: false,
            error: 'Lỗi khi đổi mật khẩu.',
            details: e.message,
        }, 500);
    }
}
