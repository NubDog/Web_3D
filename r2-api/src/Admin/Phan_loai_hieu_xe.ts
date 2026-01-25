export interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
function withCORS(body: any, status: number = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}
// Hiện tất cả phân loại hiệu xe (bao gồm tên hiệu xe từ bảng HieuXe)
export async function getPhanloaihieuxe(request: Request, env: Env): Promise<Response> {
	if (request.method === 'GET') {
		try {
			const query = `
                SELECT 
                    pl.phan_loai_id, 
                    pl.ten_phan_loai, 
                    pl.hieu_xe_id, 
					pl.danh_muc_id,
                    h.ten_hieu_xe,
                    dm.ten_danh_muc
                FROM PhanLoaiPhuongTien pl
                LEFT JOIN HieuXe h ON pl.hieu_xe_id = h.hieu_xe_id
				LEFT JOIN DanhMucPhuongTien dm ON pl.danh_muc_id = dm.danh_muc_id
				ORDER BY pl.ten_phan_loai ASC
				;
            `;

			const result = await env.DB.prepare(query).all();

			return withCORS({
				success: true,
				data: result.results,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return withCORS({
				success: false,
				error: 'Query thất bại ❌: ' + errorMessage,
			});
		}
	}
	return withCORS({ success: false, error: 'Method not allowed' });
}
// Thêm mới phân loại hiệu xe
export async function addPhanloaihieuxe(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCORS({ success: false, error: 'Chỉ hỗ trợ POST' }, 405);
	}

	try {
		const data = (await request.json()) as {
			ten_phan_loai: string;
			hieu_xe_id: number;
			danh_muc_id: number;
		};

		const { ten_phan_loai, hieu_xe_id, danh_muc_id } = data;

		if (!ten_phan_loai || !hieu_xe_id || !danh_muc_id) {
			return withCORS({ success: false, error: 'Thiếu thông tin bắt buộc' }, 400);
		}

		const tenPhanLoai = ten_phan_loai.trim();

		const hieuXeExist = await env.DB.prepare(`SELECT 1 FROM HieuXe WHERE hieu_xe_id = ? LIMIT 1`).bind(hieu_xe_id).all();

		if (hieuXeExist.results.length === 0) {
			return withCORS({ success: false, error: 'Hiệu xe không tồn tại' }, 404);
		}

		const danhMucExist = await env.DB.prepare(`SELECT 1 FROM DanhMucPhuongTien WHERE danh_muc_id = ? LIMIT 1`).bind(danh_muc_id).all();

		if (danhMucExist.results.length === 0) {
			return withCORS({ success: false, error: 'Danh mục không tồn tại' }, 404);
		}

		const duplicateResult = await env.DB.prepare(
			`SELECT COUNT(*) as count
			 FROM PhanLoaiPhuongTien
			 WHERE hieu_xe_id = ?
			   AND danh_muc_id = ?
			   AND LOWER(ten_phan_loai) = LOWER(?)`,
		)
			.bind(hieu_xe_id, danh_muc_id, tenPhanLoai)
			.all();

		if (Number(duplicateResult.results[0].count) > 0) {
			return withCORS(
				{
					success: false,
					error: 'Phân loại này đã tồn tại cho hiệu xe và danh mục đã chọn',
				},
				409,
			);
		}

		await env.DB.prepare(
			`INSERT INTO PhanLoaiPhuongTien
			 (hieu_xe_id, ten_phan_loai, danh_muc_id)
			 VALUES (?, ?, ?)`,
		)
			.bind(hieu_xe_id, tenPhanLoai, danh_muc_id)
			.run();

		return withCORS({
			success: true,
			message: 'Thêm phân loại hiệu xe thành công!',
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCORS({ success: false, error: 'Thêm thất bại ❌: ' + errorMessage }, 500);
	}
}

// Update phân loại hiệu xe
export async function updatePhanloaihieuxe(request: Request, env: Env, id: number): Promise<Response> {
	if (request.method !== 'PUT') {
		return withCORS({ success: false, error: 'Chỉ hỗ trợ PUT' }, 405);
	}

	try {
		const data = (await request.json()) as {
			ten_phan_loai: string;
			hieu_xe_id: number;
			danh_muc_id: number;
		};

		const { ten_phan_loai, hieu_xe_id, danh_muc_id } = data;

		if (!ten_phan_loai || !hieu_xe_id || !danh_muc_id) {
			return withCORS({ success: false, error: 'Thiếu thông tin bắt buộc' }, 400);
		}

		const tenPhanLoai = ten_phan_loai.trim();

		const plExist = await env.DB.prepare(`SELECT 1 FROM PhanLoaiPhuongTien WHERE phan_loai_id = ? LIMIT 1`).bind(id).all();

		if (plExist.results.length === 0) {
			return withCORS({ success: false, error: 'Phân loại không tồn tại' }, 404);
		}

		const hieuXeExist = await env.DB.prepare(`SELECT 1 FROM HieuXe WHERE hieu_xe_id = ? LIMIT 1`).bind(hieu_xe_id).all();

		if (hieuXeExist.results.length === 0) {
			return withCORS({ success: false, error: 'Hiệu xe không tồn tại' }, 404);
		}

		const danhMucExist = await env.DB.prepare(`SELECT 1 FROM DanhMucPhuongTien WHERE danh_muc_id = ? LIMIT 1`).bind(danh_muc_id).all();

		if (danhMucExist.results.length === 0) {
			return withCORS({ success: false, error: 'Danh mục không tồn tại' }, 404);
		}

		const duplicateResult = await env.DB.prepare(
			`SELECT COUNT(*) as count
			 FROM PhanLoaiPhuongTien
			 WHERE hieu_xe_id = ?
			   AND danh_muc_id = ?
			   AND LOWER(ten_phan_loai) = LOWER(?)
			   AND phan_loai_id != ?`,
		)
			.bind(hieu_xe_id, danh_muc_id, tenPhanLoai, id)
			.all();

		if (Number(duplicateResult.results[0].count) > 0) {
			return withCORS(
				{
					success: false,
					error: 'Phân loại này đã tồn tại cho hiệu xe và danh mục đã chọn',
				},
				409,
			);
		}

		await env.DB.prepare(
			`UPDATE PhanLoaiPhuongTien
			 SET hieu_xe_id = ?, ten_phan_loai = ?, danh_muc_id = ?
			 WHERE phan_loai_id = ?`,
		)
			.bind(hieu_xe_id, tenPhanLoai, danh_muc_id, id)
			.run();

		return withCORS({
			success: true,
			message: 'Cập nhật phân loại hiệu xe thành công!',
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCORS({ success: false, error: 'Cập nhật thất bại ❌: ' + errorMessage }, 500);
	}
}

// Xoá phân loại hiệu xe
export async function deletePhanloaihieuxe(request: Request, env: Env, id: number): Promise<Response> {
	if (request.method !== 'DELETE') {
		return withCORS({ success: false, error: 'Chỉ hỗ trợ DELETE' }, 405);
	}
	try {
		const data = (await request.json()) as {
			id: number;
		};
		const { id } = data;
		if (!id) {
			return withCORS({ success: false, error: 'Thiếu thông tin bắt buộc' }, 400);
		}
		const deleteQuery = `
			DELETE FROM PhanLoaiPhuongTien
			WHERE phan_loai_id = ?
		`;
		await env.DB.prepare(deleteQuery).bind(id).run();
		return withCORS({
			success: true,
			message: 'Xoá phân loại hiệu xe thành công!',
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCORS({ success: false, error: 'Xoá thất bại ❌: ' + errorMessage }, 500);
	}
}
