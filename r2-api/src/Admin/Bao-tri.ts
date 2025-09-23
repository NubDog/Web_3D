export interface Env {
	r2: R2Bucket;
	DB: D1Database;
}

export async function getBaotri(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'GET') {
		return Response.json({ success: false, error: 'Lỗi Phương thức lấy tất cả -- Bảo Trì' }, { status: 405 });
	}
	try {
		const result = await env.DB.prepare(`SELECT * FROM BaoTri`).all();
		return Response.json({ success: true, data: result.results });
	} catch (error) {
		return Response.json({ success: false, error: 'Lỗi kết nối database Bảo Trì' }, { status: 500 });
	}
}

export async function getBaotriid(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'GET') {
		return Response.json({ success: false, error: 'Lỗi Phương thức lấy id -- Bảo trì' }, { status: 405 });
	}
	try {
		const result = await env.DB.prepare(`SELECT * FROM BaoTri WHEN bao_tri_id = ?`).bind(id).all();
		if (result.results.length === 0) {
			return Response.json({ success: false, error: `Không tìm thấy phương tiện cần tìm ` + id }, { status: 404 });
		}
		return Response.json({ success: true, data: result.results[0] });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Query thất bại ❌: ' + err.message }, { status: 500 });
	}
}
export async function addbaotri(request: Request,env :Env){
	
}
