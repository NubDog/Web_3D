interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
function withCors(response: Response) {
	return new Response(response.body, {
		status: response.status,
		headers: {
			...Object.fromEntries(response.headers),
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}
// Hiện tất cả hiệu phương tiện
export async function gethieupt(request: Request, env: Env): Promise<Response> {
	try {
		const result = await env.DB.prepare('SELECT * FROM HieuXe;').all();
		return withCors(Response.json({ success: true, data: result.results }));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCors(Response.json({ success: false, error: 'Query thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
// Thêm mới hiệu phương tiện
export async function addhieupt(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCors(Response.json({ success: false, error: 'Chỉ hỗ trợ POST' }, { status: 405 }));
	}
	try {
		const data = (await request.json()) as {
			ten_hieu: string;
		};
		const { ten_hieu } = data;
		if (!ten_hieu) {
			return withCors(Response.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 }));
		}
		const insertQuery = `
            INSERT INTO HieuXe 
            (ten_hieu)
            VALUES (?)
        `;
		const result = await env.DB.prepare(insertQuery).bind(ten_hieu).run();
		return withCors(
			Response.json({ success: true, message: 'Thêm hiệu phương tiện thành công!', data: { id: result.lastInsertRowid, ten_hieu } })
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCors(Response.json({ success: false, error: 'Thêm thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
// Cập nhật hiệu phương tiện
export async function updatehieupt(request: Request, env: Env, id: number): Promise<Response> {
	if (request.method !== 'PUT') {
		return withCors(Response.json({ success: false, error: 'Chỉ hỗ trợ PUT' }, { status: 405 }));
	}
	try {
		const data = (await request.json()) as {
			ten_hieu: string;
		};
		const { ten_hieu } = data;
		if (!ten_hieu) {
			return withCors(Response.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 }));
		}
		const updateQuery = `
            UPDATE HieuXe   
            SET ten_hieu = ?
            WHERE id = ?
        `;
		await env.DB.prepare(updateQuery).bind(ten_hieu, id).run();
		return withCors(Response.json({ success: true, message: 'Cập nhật hiệu phương tiện thành công!' }));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCors(Response.json({ success: false, error: 'Cập nhật thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
// Xóa hiệu phương tiện
export async function deletehieupt(request: Request, env: Env, id: number): Promise<Response> {
	if (request.method !== 'DELETE') {
		return withCors(Response.json({ success: false, error: 'Chỉ hỗ trợ DELETE' }, { status: 405 }));
	}
	try {
		const deleteQuery = `
            DELETE FROM HieuXe
            WHERE id = ?
        `;
		await env.DB.prepare(deleteQuery).bind(id).run();
		return withCors(Response.json({ success: true, message: 'Xóa hiệu phương tiện thành công!' }));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return withCors(Response.json({ success: false, error: 'Xóa thất bại ❌: ' + errorMessage }, { status: 500 }));
	}
}
