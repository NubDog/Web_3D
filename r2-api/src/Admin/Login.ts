export interface Env {
	r2: R2Bucket;
	DB: D1Database;
}

export async function getLogin(request: Request, env: Env): Promise<Response> {
	// Handle preflight OPTIONS request
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	}

	if (request.method !== 'POST') {
		return new Response(JSON.stringify({ success: false, error: 'Chỉ hỗ trợ POST' }), {
			status: 405,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
		});
	}

	try {
		const body = (await request.json()) as { username: string; password: string };
		const { username, password } = body;

		if (!username || !password) {
			return new Response(JSON.stringify({ success: false, error: 'Thiếu username hoặc password' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			});
		}

		const query = `SELECT nguoi_dung_id, ten_dang_nhap, vai_tro, ho_ten
                       FROM NguoiDung 
                       WHERE ten_dang_nhap = ? AND mat_khau = ?`;
		const user = await env.DB.prepare(query).bind(username, password).first();

		if (!user) {
			return new Response(JSON.stringify({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu ❌' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Đăng nhập thành công ✅',
				data: {
					nguoi_dung_id: user.nguoi_dung_id,
					username: user.ho_ten,
					chucVu: user.vai_tro,
				},
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			}
		);
	} catch (err: any) {
		return new Response(JSON.stringify({ success: false, error: 'Lỗi server: ' + (err?.message ?? String(err)) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
		});
	}
}
