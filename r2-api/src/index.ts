import { handleGetUsers, handleCreateUser, handleUpdateUser, handleDeleteUser } from './Admin/admin-users';
// import { Env } from './type';
import { addphuongtien, deletePhuongTien, getPhuongTienById, getPhuongTiens, updatePhuongTien } from './Admin/Phuong-tien';

// Cần xác định xem bạn muốn giữ lại giao diện Env nào.
// Có vẻ như cả hai đều cần thiết.
interface Env {
	r2: R2Bucket;
	DB: D1Database;
	rental_db: D1Database;
}

const jsonResponse = (data: any, status = 200) => {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	return new Response(JSON.stringify(data), { status, headers });
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return jsonResponse(null);
		}

		const url = new URL(request.url);
		const path = url.pathname;

		try {
			// Kiểm tra đã kết nối R2 chưa
			if (path === '/test-r2' && request.method === 'GET') {
				try {
					const listResponse = await env.r2.list();
					return Response.json({
						success: true,
						message: 'Kết nối R2 thành công 🎉',
						objects: listResponse.objects,
					});
				} catch (err: any) {
					return Response.json(
						{
							success: false,
							error: 'Kết nối R2 thất bại ❌: ' + err.message,
						},
						{ status: 500 }
					);
				}
			}
			// Kiểm tra đã kết nối DB chưa
			if (path === '/test-db' && request.method === 'GET') {
				try {
					const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
					return Response.json({
						success: true,
						message: 'Kết nối DB thành công 🎉',
						tables: results,
					});
				} catch (err: any) {
					return Response.json(
						{
							success: false,
							error: 'Kết nối DB thất bại ❌: ' + err.message,
						},
						{ status: 500 }
					);
				}
			}

			// Route cho người dùng
			if (path === '/nguoi-dung') {
				if (request.method === 'GET') return handleGetUsers(env);
				if (request.method === 'POST') return handleCreateUser(request, env);
			}

			const userMatch = path.match(/^\/nguoi-dung\/(\d+)$/);
			if (userMatch) {
				const id = userMatch[1];
				if (request.method === 'PUT') return handleUpdateUser(request, env, id);
				if (request.method === 'DELETE') return handleDeleteUser(env, id);
			}

			// Route cho phương tiện
			if (path === '/Admin/phuong-tien' && request.method === 'POST') {
				return addphuongtien(request, env);
			}
			if (path.startsWith('/Admin/phuong-tien/') && request.method === 'PUT') {
				const id = path.split('/')[3];
				if (id) {
					return updatePhuongTien(request, env, id);
				}
			}
			if (path.startsWith('/Admin/phuong-tien/') && request.method === 'DELETE') {
				const id = path.split('/')[3];
				if (id) {
					return deletePhuongTien(request, env, id);
				}
			}

			const phuongTienIdMatch = path.match(/^\/Admin\/phuong-tien\/(\d+)$/);
			if (phuongTienIdMatch) {
				const id = phuongTienIdMatch[1];
				return getPhuongTienById(request, env, id);
			}
			if (path.startsWith('/Admin/phuong-tien')) {
				return getPhuongTiens(request, env);
			}

			// Route mặc định nếu không khớp
			return jsonResponse({ success: false, error: 'Route not found' }, 404);
		} catch (e: any) {
			console.error('API Error:', e);
			return jsonResponse({ success: false, error: e.message || 'Internal Server Error' }, 500);
		}
	},
};
