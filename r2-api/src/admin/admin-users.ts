
import { validateCustomerData } from '../admin/admin-customers';
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

// Hàm xử lý lỗi validation cho dữ liệu trùng lặp
const validateUniqueness = async (env: Env, body: any, currentUserId: string | null = null) => {
    const checks = [
        { field: 'TenDangNhap', value: body.TenDangNhap, column: 'ten_dang_nhap', error: 'Tên đăng nhập đã tồn tại.' },
        { field: 'Email', value: body.Email, column: 'email', error: 'Email đã tồn tại.' },
        { field: 'SoDienThoai', value: body.SoDienThoai, column: 'so_dien_thoai', error: 'Số điện thoại đã tồn tại.' },
    ];

    for (const check of checks) {
        if (!check.value) continue;

        let query = `SELECT nguoi_dung_id FROM NguoiDung WHERE ${check.column} = ?`;
        const params: (string | null)[] = [check.value];

        if (currentUserId) {
            query += ' AND nguoi_dung_id != ?';
            params.push(currentUserId);
        }

        const existing = await env.DB.prepare(query).bind(...params).first();
        if (existing) {
            return { error: check.error };
        }
    }
    return { error: null };
};

const created_date_time = "datetime('now', '+7 hours')";
const updated_date_time = "datetime('now', '+7 hours')";



export const handleGetUsers = async (env: Env) => {
    const { results } = await env.DB.prepare(
        `SELECT nguoi_dung_id, ten_dang_nhap, ho_ten, email, so_dien_thoai, vai_tro, ngay_tao, ngay_cap_nhat FROM NguoiDung`
    ).all();
    return jsonResponse({ success: true, data: results });
};

export const handleCreateUser = async (request: Request, env: Env) => {
    try {
        const body: any = await request.json();

        if (!body.TenDangNhap || !body.Email || !body.MatKhau || !body.VaiTro) {
            return jsonResponse({ success: false, error: 'Thiếu thông tin người dùng bắt buộc' }, 400);
        }
        if(body.SoDienThoai && !/^\d{10}$/.test(body.SoDienThoai)){
            return jsonResponse({success: false, error: 'Số điện thoại không hợp lệ (Phải là 10 số)'}, 400)
        }
        const userUniquenessError = await validateUniqueness(env, body);
        if (userUniquenessError.error) {
            return jsonResponse({ success: false, error: userUniquenessError.error }, 409);
        }

        
        let newUserId: number | null = null;

        if (body.VaiTro === 'KhachHang') {
            const customerDataError = validateCustomerData(body);
            if (customerDataError.error) {
                return jsonResponse({ success: false, error: customerDataError.error }, 400);
            }
        }

        const userStmt = env.DB.prepare(
            `INSERT INTO NguoiDung (ten_dang_nhap, ho_ten, email, mat_khau, so_dien_thoai, vai_tro, ngay_tao, ngay_cap_nhat) 
             VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'), datetime('now', '+7 hours'))
             RETURNING nguoi_dung_id` 
        ).bind(
            body.TenDangNhap, 
            body.HoTen, 
            body.Email, 
            body.MatKhau, 
            body.SoDienThoai || null, 
            body.VaiTro
        );
        
        const newUser = await userStmt.first<{ nguoi_dung_id: number }>();
        if (!newUser || !newUser.nguoi_dung_id) {
             throw new Error("Không thể tạo người dùng hoặc lấy ID người dùng mới.");
        }
        newUserId = newUser.nguoi_dung_id;


        if (body.VaiTro === 'KhachHang' && newUserId) {
            const customerStmt = env.DB.prepare(
                `INSERT INTO KhachHang (nguoi_dung_id, ho_ten, ngay_sinh, dia_chi, thanh_pho, tinh, ma_buu_chinh, quoc_gia, ngay_tao, ngay_cap_nhat) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'), datetime('now', '+7 hours'))`
            ).bind(
                newUserId,
                body.HoTen, 
                body.ngay_sinh,
                body.dia_chi,
                body.thanh_pho,
                body.tinh,
                body.ma_buu_chinh || null,
                body.quoc_gia || null
            );
            await customerStmt.run();
        }

        return jsonResponse({ success: true, message: 'Tạo người dùng và hồ sơ khách hàng thành công' }, 201);

    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi khi xử lý yêu cầu tạo mới', details: e.message }, 500);
    }
};

export const handleUpdateUser = async (request: Request, env: Env, id: string) => {
    const body: any = await request.json();
    if (!body.TenDangNhap || !body.HoTen || !body.Email || !body.VaiTro) {
        return jsonResponse({ success: false, error: 'Thiếu thông tin bắt buộc' }, 400);
    }
    
    if(body.SoDienThoai && !/^\d{10}$/.test(body.SoDienThoai)){
      return jsonResponse({success: false, error: 'Số điện thoại không hợp lệ (Phải là 10 số)'}, 400)
    }

    const { error } = await validateUniqueness(env, body, id);
    if (error) {
        return jsonResponse({ success: false, error: error.replace('đã tồn tại.', 'đã thuộc về người dùng khác.') }, 409);
    }

    const stmt = env.DB.prepare(
        `UPDATE NguoiDung SET ten_dang_nhap = ?, ho_ten = ?, email = ?, so_dien_thoai = ?, vai_tro = ?,ngay_cap_nhat = datetime('now', '+7 hours') WHERE nguoi_dung_id = ?`
    ).bind(body.TenDangNhap, body.HoTen, body.Email, body.SoDienThoai || null, body.VaiTro,  id);

    await stmt.run();
    return jsonResponse({ success: true, message: 'Cập nhật người dùng thành công' });
};

export const handleDeleteUser = async (env: Env, id: string) => {
    await env.DB.prepare('DELETE FROM NguoiDung WHERE nguoi_dung_id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Xóa người dùng thành công' });
};

