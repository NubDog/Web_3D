interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
// hiện tất cả phương tiện
export async function getPhuongTiens(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;

	if (request.method === 'GET') {
		try {
			const { searchParams } = new URL(request.url);
			const trang_thai = searchParams.get('trang_thai');
			const limit = searchParams.get('limit');
			const fields = searchParams.get('fields');

			let query = `
                SELECT 
                    ${fields || `p.*, d.ten_danh_muc, c.ten_chinh_sach, c.gia_co_ban, c.tien_coc_mac_dinh`}
                FROM PhuongTien p
                LEFT JOIN DanhMucPhuongTien d ON p.danh_muc_id = d.danh_muc_id
                LEFT JOIN ChinhSachGia c ON p.chinh_sach_id = c.chinh_sach_id
            `;

			const queryParams: (string | number)[] = [];

			if (trang_thai) {
				query += ` WHERE p.trang_thai = ?`;
				queryParams.push(trang_thai);
			}

			if (limit) {
				query += ` LIMIT ?`;
				queryParams.push(parseInt(limit, 10));
			}

			const stmt = env.DB.prepare(query).bind(...queryParams);
			const result = await stmt.all();

			return Response.json({ success: true, data: result.results });
		} catch (err: any) {
			return Response.json({ success: false, error: 'Query thất bại ❌: ' + err.message }, { status: 500 });
		}
	}

	return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
// Hiện chi tiết phương tiện theo ID
export async function getPhuongTienById(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'GET') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}

	try {
		const result = await env.DB.prepare(
			`
      SELECT p.phuong_tien_id, p.ten_phuong_tien, p.bien_so, p.so_km, p.trang_thai,
             d.ten_danh_muc,p.*,	
             c.ten_chinh_sach, c.gia_co_ban, c.tien_coc_mac_dinh
			FROM PhuongTien p
			LEFT JOIN DanhMucPhuongTien d ON p.danh_muc_id = d.danh_muc_id
			LEFT JOIN ChinhSachGia c ON p.chinh_sach_id = c.chinh_sach_id
			WHERE p.phuong_tien_id = ?
			`
		)
			.bind(id)
			.all();

		if (result.results.length === 0) {
			return Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 });
		}

		return Response.json({ success: true, data: result.results[0] });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Query thất bại ❌: ' + err.message }, { status: 500 });
	}
}
// Thêm phương tiện mới
export async function addphuongtien(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}
	try {
		const body = (await request.json()) as {
			ten_phuong_tien: string;
			loai: string;
			danh_muc_id: number;
			trang_thai: string;
			bien_so: string;
			so_km: number;
			chinh_sach_id: number;
			so_khung: string;
		};
		const { ten_phuong_tien, loai, danh_muc_id, trang_thai, bien_so, so_km, chinh_sach_id, so_khung } = body;
		if (!ten_phuong_tien || !loai || !danh_muc_id || !trang_thai || !bien_so || !so_km || !chinh_sach_id || !so_khung) {
			return Response.json({ success: false, error: 'Thiếu thông tin phương tiện' }, { status: 400 });
		}
		const result = await env.DB.prepare(
			`INSERT INTO PhuongTien (ten_phuong_tien, loai, danh_muc_id, trang_thai, bien_so, so_km, chinh_sach_id, so_khung)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(ten_phuong_tien, loai, danh_muc_id, trang_thai, bien_so, so_km, chinh_sach_id, so_khung)
			.run();
		return Response.json({ success: true, message: 'Thêm phương tiện thành công', phuong_tien_id: result.meta.last_row_id });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Thêm phương tiện thất bại ❌: ' + err.message }, { status: 500 });
	}
}
// Cập nhật thông tin phương tiện
export async function updatePhuongTien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'PUT') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}

	try {
		const body = (await request.json()) as {
			ten_phuong_tien?: string;
			loai?: string;
			danh_muc_id?: number;
			trang_thai?: string;
			bien_so?: string;
			so_km?: number;
			chinh_sach_id?: number;
			so_khung?: string;
		};

		// 1. Tìm bản ghi hiện có. Sử dụng .first() để an toàn hơn.
		const existingRecord = await env.DB.prepare('SELECT * FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).first();

		if (!existingRecord) {
			return Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 });
		}

		// 2. Tạo một đối tượng chứa các giá trị cuối cùng để cập nhật.
		// Dùng toán tử `??` để lấy giá trị mới hoặc giữ lại giá trị cũ.
		const finalValues = {
			ten_phuong_tien: body.ten_phuong_tien ?? existingRecord.ten_phuong_tien,
			loai: body.loai ?? existingRecord.loai,
			danh_muc_id: body.danh_muc_id ?? existingRecord.danh_muc_id,
			trang_thai: body.trang_thai ?? existingRecord.trang_thai,
			bien_so: body.bien_so ?? existingRecord.bien_so,
			so_km: body.so_km ?? existingRecord.so_km,
			chinh_sach_id: body.chinh_sach_id ?? existingRecord.chinh_sach_id,
			so_khung: body.so_khung ?? existingRecord.so_khung,
		};

		// 3. Đảm bảo không có giá trị 'undefined' nào được truyền vào D1.
		// Chuyển đổi mọi giá trị 'undefined' thành 'null'.
		const safeValues = Object.values(finalValues).map((value) => (value === undefined ? null : value));

		// 4. Cập nhật vào cơ sở dữ liệu.
		await env.DB.prepare(
			`UPDATE PhuongTien
            SET ten_phuong_tien = ?, loai = ?, danh_muc_id = ?, trang_thai = ?, bien_so = ?, so_km = ?, chinh_sach_id = ?, so_khung = ?
            WHERE phuong_tien_id = ?`
		)
			.bind(...safeValues, id) // Sử dụng spread operator (...) để truyền mảng giá trị vào `.bind()`.
			.run();

		return Response.json({ success: true, message: 'Cập nhật phương tiện thành công' });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Lỗi khi cập nhật phương tiện', details: err.message }, { status: 500 });
	}
}
// Xoá phương tiện
export async function deletePhuongTien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'DELETE') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}
	try {
		// Sử dụng .first() để kiểm tra sự tồn tại, nó an toàn hơn.
		const existing = await env.DB.prepare('SELECT phuong_tien_id FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).first();

		if (!existing) {
			return Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 });
		}

		// Xoá phương tiện
		await env.DB.prepare('DELETE FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).run();

		return Response.json({ success: true, message: 'Xoá phương tiện thành công' });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Lỗi khi xoá phương tiện', details: err.message }, { status: 500 });
	}
}
