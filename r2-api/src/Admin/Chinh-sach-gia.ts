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
	}); //
}
// hiện tất cả chính sách giá
export async function getChinhSachGias(request: Request, env: Env): Promise<Response> {
	if (request.method === 'GET') {
		try {
			const result = await env.DB.prepare('SELECT * FROM ChinhSachGia;').all();
			return withCORS({ success: true, data: result.results });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return withCORS({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
		}
	}
	return withCORS({ success: false, error: 'Method not allowed' });
}
// Thêm mới chính sách giá
export async function addChinhSachGia(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCORS({ success: false, error: 'Chỉ hỗ trợ POST' }, 405);
	}

	try {
		const data = (await request.json()) as {
			TenChinhSach: string;
			GiaCoBan: number;
			TienCocMacDinh: number;
			PhiPhatCoBan: number;
			TyLeGiam?: number;
		};

		const { TenChinhSach, GiaCoBan, TienCocMacDinh, PhiPhatCoBan, TyLeGiam } = data;

		if (!TenChinhSach || GiaCoBan == null || TienCocMacDinh == null || PhiPhatCoBan == null) {
			return withCORS({ success: false, error: 'Thiếu thông tin bắt buộc' }, 400);
		}

		const tenChinhSach = TenChinhSach.trim();

		const duplicate = await env.DB.prepare(
			`
				SELECT 1 
				FROM ChinhSachGia 
				WHERE LOWER(ten_chinh_sach) = LOWER(?)
			`,
		)
			.bind(tenChinhSach)
			.first();

		if (duplicate) {
			return withCORS(
				{
					success: false,
					error: 'Tên chính sách giá đã tồn tại',
				},
				409,
			);
		}
		if (typeof GiaCoBan !== 'number' || GiaCoBan <= 0) {
			return withCORS({ success: false, error: 'Giá cơ bản phải là số lớn hơn 0' }, 400);
		}
		if (typeof TienCocMacDinh !== 'number' || TienCocMacDinh <= 0 || TienCocMacDinh > 100) {
			return withCORS({ success: false, error: 'Tiền cọc mặc định phải là % trong khoảng 1–100' }, 400);
		}

		if (typeof PhiPhatCoBan !== 'number' || PhiPhatCoBan < 0) {
			return withCORS({ success: false, error: 'Phí phạt cơ bản không được nhỏ hơn 0' }, 400);
		}

		if (TyLeGiam !== undefined) {
			if (typeof TyLeGiam !== 'number' || TyLeGiam < 0 || TyLeGiam > 100) {
				return withCORS({ success: false, error: 'Tỷ lệ giảm phải nằm trong khoảng 0–100%' }, 400);
			}
		}

		const insertQuery = `
			INSERT INTO ChinhSachGia 
			(
				ten_chinh_sach,
				gia_co_ban,
				tien_coc_mac_dinh,
				phi_phat_co_ban,
				ty_le_giam,
				ngay_tao,
				ngay_cap_nhat
			) 
			VALUES (
				?, ?, ?, ?, ?, 
				datetime('now', '+7 hours'),
				datetime('now', '+7 hours')
			)
		`;

		const result = await env.DB.prepare(insertQuery)
			.bind(tenChinhSach, GiaCoBan, TienCocMacDinh, PhiPhatCoBan, TyLeGiam ?? null)
			.run();

		return withCORS(
			{
				success: true,
				message: 'Thêm chính sách giá thành công',
				data: { id: result.meta.last_row_id },
			},
			201,
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		return withCORS(
			{
				success: false,
				error: 'Thêm thất bại ❌: ' + errorMessage,
			},
			500,
		);
	}
}

// Cập nhật chính sách giá
export async function updateChinhSachGia(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'PUT') {
		return withCORS({ success: false, error: 'Method not allowed' }, 405);
	}

	try {
		const data = (await request.json()) as {
			TenChinhSach?: string;
			GiaCoBan?: number;
			TienCocMacDinh?: number;
			PhiPhatCoBan?: number;
			TyLeGiam?: number;
		};

		if (!id) {
			return withCORS({ success: false, error: 'Thiếu ID chính sách giá' }, 400);
		}

		const existing = await env.DB.prepare('SELECT * FROM ChinhSachGia WHERE chinh_sach_id = ?').bind(id).first();

		if (!existing) {
			return withCORS({ success: false, error: 'Chính sách giá không tồn tại' }, 404);
		}

		if (data.TenChinhSach !== undefined) {
			const tenChinhSach = data.TenChinhSach.trim();

			if (!tenChinhSach) {
				return withCORS({ success: false, error: 'Tên chính sách giá không được để trống' }, 400);
			}

			const duplicate = await env.DB.prepare(
				`
				SELECT 1
				FROM ChinhSachGia
				WHERE LOWER(ten_chinh_sach) = LOWER(?)
				AND chinh_sach_id != ?
			`,
			)
				.bind(tenChinhSach, id)
				.first();

			if (duplicate) {
				return withCORS({ success: false, error: 'Tên chính sách giá đã tồn tại' }, 409);
			}
		}

		if (data.GiaCoBan !== undefined) {
			if (typeof data.GiaCoBan !== 'number' || data.GiaCoBan <= 0) {
				return withCORS({ success: false, error: 'Giá cơ bản phải là số lớn hơn 0' }, 400);
			}
		}

		if (data.TienCocMacDinh !== undefined) {
			if (typeof data.TienCocMacDinh !== 'number' || data.TienCocMacDinh <= 0 || data.TienCocMacDinh > 100) {
				return withCORS(
					{
						success: false,
						error: 'Tiền cọc mặc định phải là % trong khoảng 1–100',
					},
					400,
				);
			}
		}

		if (data.PhiPhatCoBan !== undefined) {
			if (typeof data.PhiPhatCoBan !== 'number' || data.PhiPhatCoBan < 0) {
				return withCORS({ success: false, error: 'Phí phạt cơ bản không được nhỏ hơn 0' }, 400);
			}
		}

		if (data.TyLeGiam !== undefined) {
			if (typeof data.TyLeGiam !== 'number' || data.TyLeGiam < 0 || data.TyLeGiam > 100) {
				return withCORS({ success: false, error: 'Tỷ lệ giảm phải nằm trong khoảng 0–100%' }, 400);
			}
		}

		const fields: string[] = [];
		const values: any[] = [];

		if (data.TenChinhSach !== undefined) {
			fields.push('ten_chinh_sach = ?');
			values.push(data.TenChinhSach.trim());
		}
		if (data.GiaCoBan !== undefined) {
			fields.push('gia_co_ban = ?');
			values.push(data.GiaCoBan);
		}
		if (data.TienCocMacDinh !== undefined) {
			fields.push('tien_coc_mac_dinh = ?');
			values.push(data.TienCocMacDinh);
		}
		if (data.PhiPhatCoBan !== undefined) {
			fields.push('phi_phat_co_ban = ?');
			values.push(data.PhiPhatCoBan);
		}
		if (data.TyLeGiam !== undefined) {
			fields.push('ty_le_giam = ?');
			values.push(data.TyLeGiam);
		}

		if (fields.length === 0) {
			return withCORS({ success: false, error: 'Không có trường nào để cập nhật' }, 400);
		}

		fields.push("ngay_cap_nhat = datetime('now', '+7 hours')");

		const updateQuery = `
			UPDATE ChinhSachGia
			SET ${fields.join(', ')}
			WHERE chinh_sach_id = ?
		`;

		values.push(id);

		await env.DB.prepare(updateQuery)
			.bind(...values)
			.run();

		return withCORS({ success: true, message: 'Cập nhật chính sách giá thành công' }, 200);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		return withCORS(
			{
				success: false,
				error: 'Cập nhật thất bại ❌: ' + errorMessage,
			},
			500,
		);
	}
}

// Xóa chính sách giá
export async function deleteChinhSachGia(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'DELETE') {
		return withCORS(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}
	try {
		const existingResult = await env.DB.prepare('SELECT COUNT(*) as count FROM ChinhSachGia WHERE chinh_sach_id = ?;').bind(id).all();

		const exists = Number(existingResult.results[0].count);
		if (exists === 0) {
			return withCORS({ success: false, error: `Không tìm thấy chính sách giá với ID ${id}` }, 404);
		}

		await env.DB.prepare('DELETE FROM ChinhSachGia WHERE chinh_sach_id = ?;').bind(id).run();

		return withCORS({ success: true, message: 'Xóa chính sách giá thành công ✅' });
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return withCORS({ success: false, error: 'Xóa chính sách giá thất bại ❌: ' + errorMessage }, 500);
	}
}
