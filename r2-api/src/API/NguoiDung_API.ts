interface Env {
    DB: D1Database;
    ua: R2Bucket
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

export async function handleLogin(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as { ten_dang_nhap?: string; email?: string; mat_khau: string };

        const identifier = body.ten_dang_nhap || body.email; 
        if (!identifier || !body.mat_khau) {
            return jsonResponse({ success: false, error: "Vui lòng cung cấp thông tin đăng nhập và mật khẩu." }, 400);
        }

        const queryField = body.email ? 'email' : 'ten_dang_nhap';
        
        const user = await env.DB.prepare(`SELECT * FROM NguoiDung WHERE ${queryField} = ?`)
            .bind(identifier)
            .first<{ nguoi_dung_id: number; ho_ten: string; email: string; vai_tro: string; mat_khau: string; trang_thai: string }>();

        if (!user || user.trang_thai !== 'active') {
            return jsonResponse({ success: false, error: 'Người dùng bị vô hiệu hóa' }, 401);
        }

        if (user.mat_khau !== body.mat_khau) {
            return jsonResponse({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
        }

        const { mat_khau, ...userData } = user;

        return jsonResponse({ success: true, data: userData });

    } catch (e: any) {
        console.error("API Error in handleLogin:", e);
        return jsonResponse({ success: false, error: 'Lỗi server nội bộ.', details: e.message }, 500);
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
         const formData = await request.formData();

        const body = {
            ten_dang_nhap: formData.get('ten_dang_nhap') as string,
            mat_khau: formData.get('mat_khau') as string,
            ho_ten: formData.get('ho_ten') as string,
            email: formData.get('email') as string,
            so_dien_thoai: formData.get('so_dien_thoai') as string,
            ngay_sinh: formData.get('ngay_sinh') as string,
            dia_chi: formData.get('dia_chi') as string,
            tinh: formData.get('tinh') as string,
            thanh_pho: formData.get('thanh_pho') as string,
            ma_buu_chinh: formData.get('ma_buu_chinh') as string | null,
            quoc_gia: formData.get('quoc_gia') as string | null,
            vai_tro: formData.get('vai_tro') as string | null,
            trang_thai: formData.get('trang_thai') as string | null,
        };
        const avatarFile = formData.get('avatar') as File | null;

          const requiredFields = ['ten_dang_nhap', 'mat_khau', 'ho_ten', 'email', 'so_dien_thoai', 'ngay_sinh', 'dia_chi', 'tinh', 'thanh_pho'];
        for (const field of requiredFields) {
            if (!body[field as keyof typeof body]) {
                return jsonResponse({ success: false, error: `Trường '${field}' là bắt buộc.` }, 400);
            }
        }

        let avatarUrl: string | null = null;
        if (avatarFile && avatarFile.size > 0) {
            const uniqueKey = `avatars/${Date.now()}-${avatarFile.name}`;
            await env.ua.put(uniqueKey, await avatarFile.arrayBuffer(), {
                httpMetadata: { contentType: avatarFile.type },
            });
            const publicUrl = "https://pub-835d991ae08743e2937fa6d3c13f82df.r2.dev";
            avatarUrl = `${publicUrl}/${uniqueKey}`;
        }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
            return jsonResponse({
                success: false,
                error: 'Email không đúng định dạng.'
            }, 400);
            }

            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(body.so_dien_thoai)) {
            return jsonResponse({
                success: false,
                error: 'Số điện thoại phải có đúng 10 chữ số.'
            }, 400);
            }

              const checks = [
            { column: 'ten_dang_nhap', value: body.ten_dang_nhap, error: 'Tên đăng nhập đã tồn tại.' },
            { column: 'email', value: body.email, error: 'Email đã tồn tại.' },
            { column: 'so_dien_thoai', value: body.so_dien_thoai, error: 'Số điện thoại đã tồn tại.' },
            ];
        for (const check of checks) {
            const existing = await env.DB.prepare(`SELECT nguoi_dung_id FROM NguoiDung WHERE ${check.column} = ?`).bind(check.value).first();
            if (existing) {
                return jsonResponse({ success: false, error: check.error }, 409);
            }
            }

        const query = `
            INSERT INTO NguoiDung (
                ten_dang_nhap, mat_khau, vai_tro, trang_thai, ho_ten, email, so_dien_thoai, ngay_tao, ngay_cap_nhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        
        const vai_tro = body.vai_tro || 'KhachHang';
        const trang_thai = body.trang_thai || 'active';

        const psUser = env.DB.prepare(query).bind(
            body.ten_dang_nhap,
            body.mat_khau,
            vai_tro,
            trang_thai,
            body.ho_ten,
            body.email,
            body.so_dien_thoai
        );

         const createdUser = await psUser.first<{
            nguoi_dung_id: number;
            ho_ten: string;
            email: string;
            vai_tro: string;
        }>();

        if (!createdUser || !createdUser.nguoi_dung_id) {
            throw new Error('Không thể tạo người dùng hoặc lấy ID người dùng.');
        }

        if (vai_tro.toLowerCase() === 'khachhang') {
            const customerStmt = env.DB.prepare(
            `INSERT INTO KhachHang (nguoi_dung_id, ho_ten, ngay_sinh, dia_chi, thanh_pho, tinh, ma_buu_chinh, quoc_gia, avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                createdUser.nguoi_dung_id, body.ho_ten, body.ngay_sinh, body.dia_chi, body.thanh_pho,
                body.tinh, body.ma_buu_chinh || null, body.quoc_gia || 'VN', avatarUrl
            );
            await customerStmt.run();
        }

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
