/**
 * R2 API Worker for handling file operations and database
 */

import { addphuongtien, deletePhuongTien, getPhuongTienById, getPhuongTiens, updatePhuongTien } from './Admin/Phuong-tien';

interface Env {
	r2: R2Bucket;
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		// Kiểm tra đã kết nối R2 chưa
		if (path === '/test-r2' && request.method === 'GET') {
			try {
				// Lấy danh sách các đối tượng trong bucket R2
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
				// Lấy danh sách bảng trong DB
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
		//// Route cho phương tiện
		// Thêm phương tiện mới
		if (path === '/Admin/phuong-tien' && request.method === 'POST') {
			return addphuongtien(request, env);
		}
		// Cập nhật phương tiện
		if (path.startsWith('/Admin/phuong-tien/') && request.method === 'PUT') {
			const id = path.split('/')[3]; // Sửa chỉ số từ 4 về 3
			if (id) {
				return updatePhuongTien(request, env, id);
			}
		}
		// Xoá phương tiện
		if (path.startsWith('/Admin/phuong-tien/') && request.method === 'DELETE') {
			const id = path.split('/')[3]; // Sửa chỉ số từ 4 về 3
			if (id) {
				return deletePhuongTien(request, env, id);
			}
		}

		// phải kiểm tra route chi tiết trước vì nếu kiểm tra chung trước thì sẽ bị bắt qua chung và bị sai
		// Hiện chi tiết phương tiện theo ID
		const phuongTienIdMatch = path.match(/^\/Admin\/phuong-tien\/(\d+)$/);
		if (phuongTienIdMatch) {
			const id = phuongTienIdMatch[1];
			return getPhuongTienById(request, env, id);
		}
		// Hiện tất cả phương tiện
		if (path.startsWith('/Admin/phuong-tien')) {
			return getPhuongTiens(request, env);
		}

		// Nếu route không khớp
		return Response.json({ success: false, error: 'Route not found' }, { status: 404 });
	},
};
