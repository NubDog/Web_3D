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
// Hiện tất cả phân lại loại hiệu xe
export async function getPhanloaihieuxe(request: Request, env: Env): Promise<Response> {
	if (request.method === 'GET') {
		try {
			const result = await env.DB.prepare('SELECT * FROM PhanLoaiHieuXe;').all();
			return withCORS({ success: true, data: result.results });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return withCORS({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
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
				data: {
					phan_loai_id: result.meta.last_row_id,
					hieu_xe_id,
					ten_phan_loai,
				},
			})
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		return withCORS(Response.json({ success: false, error: 'Thêm thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
