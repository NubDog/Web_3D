
interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
const jsonResponse = (data: any, status = 200) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return new Response(JSON.stringify(data), { status, headers });
};


/**
 * Kiểm tra các trường thông tin bắt buộc và định dạng dữ liệu cho khách hàng
 */
export const validateCustomerData = (body: any) => {
    // ho_ten có thể lấy từ body.HoTen (của user) hoặc body.ho_ten (của customer)
    const ho_ten = body.ho_ten || body.HoTen;
    if (!body.nguoi_dung_id && !ho_ten && !body.ngay_sinh && !body.dia_chi && !body.thanh_pho && !body.tinh) {
        const requiredFields = ['ho_ten', 'ngay_sinh', 'dia_chi', 'thanh_pho', 'tinh'];
        for (const field of requiredFields) {
            // Kiểm tra cả hai cách viết hoa
            const value = body[field] || body[field.charAt(0).toUpperCase() + field.slice(1)];
            if (!value) {
                return { error: `Thiếu thông tin bắt buộc: ${field}` };
            }
        }
    }
    
    // Kiểm tra định dạng ngày sinh YYYY-MM-DD
    if (body.ngay_sinh) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(body.ngay_sinh)) {
            return { error: 'Định dạng ngày sinh không hợp lệ. Vui lòng sử dụng YYYY-MM-DD.' };
        }
    }

    return { error: null };
}


/**
 * Kiểm tra xem một `nguoi_dung_id` đã được gán cho một khách hàng khác chưa.
 */
const validateNguoiDungIdUniqueness = async (env: Env, nguoiDungId: number, currentKhachHangId: string | null = null) => {
    if (!nguoiDungId) return { error: null };

    let query = `SELECT khach_hang_id FROM KhachHang WHERE nguoi_dung_id = ?`;
    const params: (number | string | null)[] = [nguoiDungId];

    if (currentKhachHangId) {
        query += ' AND khach_hang_id != ?';
        params.push(currentKhachHangId);
    }

    const existing = await env.DB.prepare(query).bind(...params).first();
    if (existing) {
        return { error: 'Người dùng này đã có hồ sơ khách hàng.' };
    }
    return { error: null };
};



/**
 * Lấy danh sách tất cả khách hàng
 */
export const handleGetCustomers = async (env: Env) => {
    try {
        const { results } = await env.DB.prepare(
            `SELECT k.*, nd.ten_dang_nhap 
             FROM KhachHang k
             LEFT JOIN NguoiDung nd ON k.nguoi_dung_id = nd.nguoi_dung_id`
        ).all();
        return jsonResponse({ success: true, data: results });
    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi truy vấn cơ sở dữ liệu', details: e.message }, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một khách hàng theo ID khách hàng
 */
export const handleGetCustomerById = async (env: Env, id: string) => {
    try {
        const customer = await env.DB.prepare(
            `SELECT k.*, nd.ten_dang_nhap 
             FROM KhachHang k
             LEFT JOIN NguoiDung nd ON k.nguoi_dung_id = nd.nguoi_dung_id
             WHERE k.khach_hang_id = ?`
        ).bind(id).first();

        if (!customer) {
            return jsonResponse({ success: false, error: 'Không tìm thấy khách hàng' }, 404);
        }
        return jsonResponse({ success: true, data: customer });
    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi truy vấn cơ sở dữ liệu', details: e.message }, 500);
    }
};

/**
 * Lấy thông tin khách hàng dựa trên ID người dùng (nguoi_dung_id)
 */
export const handleGetCustomerByUserId = async (env: Env, userId: string) => {
    try {
        if (!userId) {
            return jsonResponse({ success: false, error: 'Thiếu ID người dùng' }, 400);
        }

        const customer = await env.DB.prepare(
            `SELECT * FROM KhachHang WHERE nguoi_dung_id = ?`
        ).bind(userId).first();

        if (!customer) {
            return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ khách hàng cho người dùng này' }, 404);
        }

        return jsonResponse({ success: true, data: customer });

    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi truy vấn cơ sở dữ liệu', details: e.message }, 500);
    }
};


/**
 * Cập nhật thông tin khách hàng
 */
export const handleUpdateCustomer = async (request: Request, env: Env, id: string) => {
    try {
        const body: any = await request.json();

        const dataValidationError = validateCustomerData(body);
        if (dataValidationError.error) {
            return jsonResponse({ success: false, error: dataValidationError.error }, 400);
        }

        const uniquenessError = await validateNguoiDungIdUniqueness(env, body.nguoi_dung_id, id);
        if (uniquenessError.error) {
            return jsonResponse({ success: false, error: uniquenessError.error }, 409);
        }

        const stmt = env.DB.prepare(
            `UPDATE KhachHang SET 
                nguoi_dung_id = ?, ho_ten = ?, ngay_sinh = ?, dia_chi = ?, 
                thanh_pho = ?, tinh = ?, ma_buu_chinh = ?, quoc_gia = ?, 
                ngay_cap_nhat = datetime('now', '+7 hours') 
             WHERE khach_hang_id = ?`
        ).bind(
            body.nguoi_dung_id,
            body.ho_ten,
            body.ngay_sinh,
            body.dia_chi,
            body.tinh,
            body.thanh_pho,
            body.ma_buu_chinh || null,
            body.quoc_gia || null,
            id
        );
        const result = await stmt.run();
     
        
            
        
        
        if (result.meta.changes === 0) {
             return jsonResponse({ success: false, error: 'Không tìm thấy khách hàng để cập nhật' }, 404);
        }

         if (body.nguoi_dung_id) {
            const userStmt = env.DB.prepare(
                `UPDATE NguoiDung SET 
                    ho_ten = ?,
                    ngay_cap_nhat = datetime('now', '+7 hours')
                WHERE nguoi_dung_id = ?`
            ).bind(
                body.ho_ten,
                body.nguoi_dung_id
            );
            
            await userStmt.run();
        }

        return jsonResponse({ success: true, message: 'Cập nhật khách hàng thành công' });

        
    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi khi xử lý yêu cầu', details: e.message }, 500);
    }
};
