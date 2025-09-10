import { handleGetUsers, handleCreateUser, handleUpdateUser, handleDeleteUser, handleToggleUserStatus } from './admin/admin-users';
// import { Env } from './type';
import * as PhuongTien from './admin/Phuong-tien';
import { handleGetCustomers, handleGetCustomerById, handleUpdateCustomer, handleGetCustomerByUserId } from './admin/admin-customers';
import {
	getDanhmucphuongtienid,
	getDanhmucphuongtiens,
	Adddanhmucphuongtien,
	deleteDanhmucphuongtien,
	putDanhmucphuongtien,
} from './admin/Danh-muc-phuong-tien';
import { handleImageUpload } from './admin/upload-users-avatar';

import { handleGetFile, handleUploadFile, handleListFiles, handleDeleteFile } from './r2-handler';


interface Env {
	ua: R2Bucket;
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
		const method = request.method;

		try {
			if (path === '/upload' && method === 'POST') {
				return handleUploadFile(request, env);
			}
			if (path === '/files' && method === 'GET') {
				return handleListFiles(request, env);
			}
			const deleteMatch = path.match(/^\/delete\/(.+)/);
			if (deleteMatch && method === 'DELETE') {
				const key = decodeURIComponent(deleteMatch[1]);
				return handleDeleteFile(request, env, key);
			}
			const fileMatch = path.match(/^\/file\/(.+)/);
			if (fileMatch && method === 'GET') {
				const key = decodeURIComponent(fileMatch[1]);
				return handleGetFile(request, env, key);
			}

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
			if (path=== '/api/users/upload-avatar' && method === 'POST') {
				return handleImageUpload(request, env);
			}

			if (path === '/nguoi-dung') {
				if (request.method === 'GET') return handleGetUsers(env);
				if (request.method === 'POST') return handleCreateUser(request, env);
			}

			const statusMatch = path.match(/^\/nguoi-dung\/(\d+)\/status$/);
			if (statusMatch && request.method === 'PUT') {
				const id = statusMatch[1];
				return handleToggleUserStatus(env, id);
			}

			const userMatch = path.match(/^\/nguoi-dung\/(\d+)$/);
			if (userMatch) {
				const id = userMatch[1];
				if (request.method === 'PUT') return handleUpdateUser(request, env, id);
				if (request.method === 'DELETE') return handleDeleteUser(env, id);
			}

			// Route cho phương tiện
			if (path === '/Admin/phuong-tien' && request.method === 'POST') {
				return PhuongTien.addphuongtien(request, env);
			}
			if (path.startsWith('/Admin/phuong-tien/') && request.method === 'PUT') {
				const id = path.split('/')[3];
				if (id) {
					return PhuongTien.updatePhuongTien(request, env, id);
				}
			}
			if (path.startsWith('/Admin/phuong-tien/') && request.method === 'DELETE') {
				const id = path.split('/')[3];
				if (id) {
					return PhuongTien.deletePhuongTien(request, env, id);
				}
			}

			const phuongTienIdMatch = path.match(/^\/Admin\/phuong-tien\/(\d+)$/);
			if (phuongTienIdMatch) {
				const id = phuongTienIdMatch[1];
				return PhuongTien.getPhuongTienById(request, env, id);
			}
			if (path.startsWith('/Admin/phuong-tien')) {
				return PhuongTien.getPhuongTiens(request, env);
			} else if (path.startsWith('/api/customers')) {
				// Route: GET /api/customers/by-user/:userId
				const byUserMatch = path.match(/^\/api\/customers\/by-user\/([^\/]+)/);
				if (byUserMatch && method === 'GET') {
					const userId = byUserMatch[1];
					return handleGetCustomerByUserId(env, userId);
				}

				// Route: GET /api/customers/:id hoặc PUT /api/customers/:id
				const detailMatch = path.match(/^\/api\/customers\/([^\/]+)/);
				if (detailMatch) {
					const customerId = detailMatch[1];
					if (method === 'GET') {
						return handleGetCustomerById(env, customerId);
					}
					// if (path === 'PUT') {
					//     return handleUpdateCustomer(request, env, customerId);
					// }
					if (method === 'PUT') {
						return handleUpdateCustomer(request, env, customerId);
					}
				}

				// Route: GET /api/customers (lấy tất cả)
				if (path === '/api/customers' && method === 'GET') {
					return handleGetCustomers(env);
				}
			}
			//// Danh mục phương tiện
			const danhMucIdMatch = path.match(/^\/Admin\/danh-muc-phuong-tien\/(\d+)$/);
			if (danhMucIdMatch) {
				const id = danhMucIdMatch[1];
				if (method === 'GET') return getDanhmucphuongtienid(request, env, id);
				if (method === 'DELETE') return deleteDanhmucphuongtien(request, env, id);
				if (method === 'PUT') return putDanhmucphuongtien(request, env, id);
			} else if (path === '/Admin/danh-muc-phuong-tien') {
				if (method === 'GET') return getDanhmucphuongtiens(request, env);
				if (method === 'POST') return Adddanhmucphuongtien(request, env);
			}
			// Route mặc định nếu không khớp
			return jsonResponse({ success: false, error: 'Route not found' }, 404);
		} catch (e: any) {
			console.error('API Error:', e);
			return jsonResponse({ success: false, error: e.message || 'Internal Server Error' }, 500);
		}
	},
};
