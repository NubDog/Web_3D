interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
// Hàm hỗ trợ CORS
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
export async function getDanhmucphuongtiens(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;
	if (request.method === 'GET') {
		try {
			const result = await env.DB.prepare('SELECT * FROM DanhMucPhuongTien;').all();

			return withCORS({ success: true, data: result.results });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return withCORS({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
		}
	}
	return withCORS({ success: false, error: 'Method not allowed' });
}
export async function getDanhmucphuongtienid(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method === 'GET') {
		try {
			const result = await env.DB.prepare('SELECT * FROM DanhMucPhuongTien WHERE danh_muc_id=?;').bind(id).all();
			if (result.results.length === 0) {
				return withCORS({ success: false, error: 'Không tìm thấy danh mục với ID đã cho' }, 404);
			}
			return withCORS({ success: true, data: result.results[0] });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return withCORS({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
		}
	}
	return withCORS({ success: false, error: 'Method not allowed' });
}
export async function Adddanhmucphuongtien(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCORS({ success: false, error: 'Method not allowed' }, 405);
	}

	try {
		const body = (await request.json()) as {
			ten_danh_muc: string;
			mo_ta: string;
		};

		if (!body.ten_danh_muc || !body.mo_ta) {
			return withCORS({ success: false, error: 'Missing ten_danh_muc or mo_ta' }, 400);
		}

		const tenDanhMuc = body.ten_danh_muc.trim();

		const existingResult = await env.DB.prepare(
			`SELECT COUNT(*) as count
			 FROM DanhMucPhuongTien
			 WHERE LOWER(ten_danh_muc) = LOWER(?)`,
		)
			.bind(tenDanhMuc)
			.all();

		if (Number(existingResult.results[0].count) > 0) {
			return withCORS(
				{
					success: false,
					error: `Tên danh mục '${tenDanhMuc}' đã tồn tại`,
				},
				409,
			);
		}

		const insertResult = await env.DB.prepare(
			`INSERT INTO DanhMucPhuongTien (ten_danh_muc, mo_ta)
			 VALUES (?, ?)`,
		)
			.bind(tenDanhMuc, body.mo_ta.trim())
			.run();

		return withCORS({
			success: true,
			message: 'Thêm danh mục phương tiện thành công',
			danh_muc_id: insertResult.meta.last_row_id,
		});
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return withCORS(
			{
				success: false,
				error: 'Thêm danh mục phương tiện thất bại ❌: ' + errorMessage,
			},
			500,
		);
	}
}

export async function deleteDanhmucphuongtien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'DELETE') {
		return withCORS({ success: false, error: 'Method not allowed' }, 405);
	}
	try {
		const danhMucCount = await env.DB.prepare('SELECT COUNT(*) as count FROM DanhMucPhuongTien WHERE danh_muc_id = ?;').bind(id).all();
		const danhMucExists = Number(danhMucCount.results[0].count);

		if (danhMucExists === 0) {
			return withCORS({ success: false, error: `Không tìm thấy danh mục với ID ${id}` }, 404);
		}

		const phuongTienCount = await env.DB.prepare('SELECT COUNT(*) as count FROM PhuongTien WHERE danh_muc_id = ?;').bind(id).all();
		const phuongTienExists = Number(phuongTienCount.results[0].count);

		if (phuongTienExists > 0) {
			return withCORS(
				{
					success: false,
					error: `Xóa không thành công do danh mục ID ${id} này có trong bảng Phương Tiện.`,
				},
				409,
			);
		}

		await env.DB.prepare('DELETE FROM DanhMucPhuongTien WHERE danh_muc_id = ?;').bind(id).run();

		return withCORS({ success: true, message: 'Xóa danh mục phương tiện thành công' });
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return withCORS(
			{
				success: false,
				error: 'Xóa danh mục phương tiện thất bại ❌: ' + errorMessage,
			},
			500,
		);
	}
}
export async function putDanhmucphuongtien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'PUT') {
		return withCORS({ success: false, error: 'Method not allowed' }, 405);
	}

	try {
		const body = (await request.json()) as {
			ten_danh_muc?: string;
			mo_ta?: string;
		};

		if (!body.ten_danh_muc && !body.mo_ta) {
			return withCORS({ success: false, error: 'Missing ten_danh_muc or mo_ta' }, 400);
		}

		const existResult = await env.DB.prepare('SELECT COUNT(*) as count FROM DanhMucPhuongTien WHERE danh_muc_id = ?').bind(id).all();

		if (Number(existResult.results[0].count) === 0) {
			return withCORS({ success: false, error: `Không tìm thấy danh mục với ID ${id}` }, 404);
		}

		const tenDanhMuc = body.ten_danh_muc?.trim();

		if (tenDanhMuc) {
			const duplicateResult = await env.DB.prepare(
				`SELECT COUNT(*) as count
				 FROM DanhMucPhuongTien
				 WHERE LOWER(ten_danh_muc) = LOWER(?)
				   AND danh_muc_id != ?`,
			)
				.bind(tenDanhMuc, id)
				.all();

			if (Number(duplicateResult.results[0].count) > 0) {
				return withCORS({ success: false, error: 'Tên danh mục đã tồn tại' }, 409);
			}
		}

		const updateFields: string[] = [];
		const updateValues: any[] = [];

		if (tenDanhMuc) {
			updateFields.push('ten_danh_muc = ?');
			updateValues.push(tenDanhMuc);
		}
		if (body.mo_ta) {
			updateFields.push('mo_ta = ?');
			updateValues.push(body.mo_ta.trim());
		}

		updateValues.push(id);

		const updateQuery = `
			UPDATE DanhMucPhuongTien
			SET ${updateFields.join(', ')}
			WHERE danh_muc_id = ?
		`;

		await env.DB.prepare(updateQuery)
			.bind(...updateValues)
			.run();

		return withCORS({
			success: true,
			message: 'Cập nhật danh mục phương tiện thành công',
		});
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return withCORS({ success: false, error: 'Cập nhật thất bại: ' + errorMessage }, 500);
	}
}
