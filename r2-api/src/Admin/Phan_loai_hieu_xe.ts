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
                    h.ten_hieu_xe 
                FROM PhanLoaiHieuXe pl
                LEFT JOIN HieuXe h ON pl.hieu_xe_id = h.hieu_xe_id;
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
		return withCORS(Response.json({ success: false, error: 'Chỉ hỗ trợ POST' }, { status: 405 }));
	}

	try {
		const data = (await request.json()) as {
			ten_phan_loai: string;
			hieu_xe_id: number;
		};

		const { ten_phan_loai, hieu_xe_id } = data;

		if (!ten_phan_loai || !hieu_xe_id) {
			return withCORS(Response.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 }));
		}

		const insertQuery = `
            INSERT INTO PhanLoaiHieuXe
            (hieu_xe_id, ten_phan_loai)
            VALUES (?, ?)
        `;

		const result = await env.DB.prepare(insertQuery).bind(hieu_xe_id, ten_phan_loai).run();

		return withCORS(
			Response.json({
				success: true,
				message: 'Thêm phân loại hiệu xe thành công!',
			})
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		return withCORS(Response.json({ success: false, error: 'Thêm thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
// update phân loại hiệu xe
export async function updatePhanloaihieuxe(request: Request, env: Env, id: number): Promise<Response> {
	if (request.method !== 'PUT') {
		return withCORS(Response.json({ success: false, error: 'Chỉ hỗ trợ PUT' }, { status: 405 }));
	}
	try {
		const data = (await request.json()) as {
			id: number;
			ten_phan_loai: string;
			hieu_xe_id: number;
		};
		const { id, ten_phan_loai, hieu_xe_id } = data;
		if (!id || !ten_phan_loai || !hieu_xe_id) {
			return withCORS(Response.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 }));
		}
		const updateQuery = `
			UPDATE PhanLoaiHieuXe
			SET hieu_xe_id = ?, ten_phan_loai = ?
			WHERE phan_loai_id = ?
		`;

		const result = await env.DB.prepare(updateQuery).bind(hieu_xe_id, ten_phan_loai, id).run();

		return withCORS(
			Response.json({
				success: true,
				message: 'Cập nhật phân loại hiệu xe thành công!',
			})
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		return withCORS(Response.json({ success: false, error: 'Cập nhật thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
// Xoá phân loại hiệu xe
export async function deletePhanloaihieuxe(request: Request, env: Env, id: number): Promise<Response> {
	if (request.method !== 'DELETE') {
		return withCORS(Response.json({ success: false, error: 'Chỉ hỗ trợ DELETE' }, { status: 405 }));
	}
	try {
		const data = (await request.json()) as {
			id: number;
		};
		const { id } = data;
		if (!id) {
			return withCORS(Response.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 }));
		}
		const deleteQuery = `
			DELETE FROM PhanLoaiHieuXe
			WHERE phan_loai_id = ?
		`;
		await env.DB.prepare(deleteQuery).bind(id).run();
		return withCORS(
			Response.json({
				success: true,
				message: 'Xoá phân loại hiệu xe thành công!',
			})
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCORS(Response.json({ success: false, error: 'Xoá thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
