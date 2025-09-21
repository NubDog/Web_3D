import { handleGetUsers, handleCreateUser, handleUpdateUser, handleDeleteUser, handleToggleUserStatus } from './Admin/admin-users';
// import { Env } from './type';
import * as PhuongTien from './Admin/Phuong-tien';
import { handleGetCustomers, handleGetCustomerById, handleUpdateCustomer, handleGetCustomerByUserId } from './Admin/admin-customers';
import {
	getDanhmucphuongtienid,
	getDanhmucphuongtiens,
	Adddanhmucphuongtien,
	deleteDanhmucphuongtien,
	putDanhmucphuongtien,
} from './Admin/Danh-muc-phuong-tien';
import { addChinhSachGia, deleteChinhSachGia, getChinhSachGias, updateChinhSachGia } from './Admin/Chinh-sach-gia';
import { handleImageUpload } from './Admin/upload-users-avatar';
import { handleGetKycDocuments, handleAddKycDocument, handleUpdateCccdSet } from './Admin/admin-KYC';
import { handleGetPhuongTien } from './API/PhuongTien_API';
import { handleGetChinhSachGia } from './API/ChinhSachGia_API';

import { handleGetFile, handleUploadFile, handleListFiles, handleDeleteFile, handleGetProductImage } from './r2-handler';
import {
	handleCreateRentalOrder,
	handleGetPendingOrders,
	handleApproveOrder,
	handleRejectOrder,
	handleGetOrders,
	handleGetOrderDetails,
} from './Admin/don-thue';
import { handleVehicleHandover, handleVehicleReturn } from './Admin/giao-nhan';
import { handleFinalizeOrder } from './Admin/quyet-toan';
import { handleConfirmDeposit } from './Admin/tien_coc';
import { getLogin } from './Admin/Login';

interface Env {
	ua: R2Bucket;
	r2: R2Bucket;
	DB: D1Database;
	rental_db: D1Database;
	kyc: R2Bucket;
	product: R2Bucket;
	ICC: R2Bucket;
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

			// API for PhuongTien
			if (path === '/api/phuong-tien' && method === 'GET') {
				return handleGetPhuongTien(request, env);
			}

			// API for ChinhSachGia
			if (path === '/api/chinh-sach-gia' && method === 'GET') {
				return handleGetChinhSachGia(request, env);
			}

			if (path === '/test-r2' && request.method === 'GET') {
				try {
					const listResponse = await env.r2.list();
					return Response.json({
						success: true,
						message: 'Kết nối R2 thành công',
						objects: listResponse.objects,
					});
				} catch (err: any) {
					return Response.json(
						{
							success: false,
							error: 'Kết nối R2 thất bại: ' + err.message,
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
						message: 'Kết nối DB thành công',
						tables: results,
					});
				} catch (err: any) {
					return Response.json(
						{
							success: false,
							error: 'Kết nối DB thất bại: ' + err.message,
						},
						{ status: 500 }
					);
				}
			}

			//kyc
			const kycListMatch = path.match(/^\/api\/customers\/(\d+)\/kyc$/);
			if (kycListMatch && method === 'GET') {
				const customerId = kycListMatch[1];
				return handleGetKycDocuments(env, customerId);
			}

			const kycCccdSetMatch = path.match(/^\/api\/kyc\/cccd\/(\d+)$/);
			if (kycCccdSetMatch && method === 'PUT') {
				const customerId = kycCccdSetMatch[1];
				return handleUpdateCccdSet(request, env, customerId);
			}

			if (path === '/api/kyc' && method === 'POST') {
				return handleAddKycDocument(request, env);
			}

			// Route cho người dùng
			if (path === '/api/users/upload-avatar' && method === 'POST') {
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
			// Chính sách giá
			const chinhSachIdMatch = path.match(/^\/Admin\/chinh-sach-gia\/(\d+)$/);
			if (chinhSachIdMatch) {
				const id = chinhSachIdMatch[1];
				if (method === 'PUT') return updateChinhSachGia(request, env, id);
				if (method === 'DELETE') return deleteChinhSachGia(request, env, id);
			} else if (path === '/Admin/chinh-sach-gia') {
				if (method === 'GET') return getChinhSachGias(request, env);
				if (method === 'POST') return addChinhSachGia(request, env);
			}

			const productImageMatch = path.match(/^\/product-image\/(.+)/);
			if (productImageMatch && method === 'GET') {
				const key = decodeURIComponent(productImageMatch[1]);
				return handleGetProductImage(request, env, key);
			}

			if (path === '/api/don-thue' && method === 'POST') {
				return handleCreateRentalOrder(request, env);
			}

			if (path === '/api/don-thue/pending' && method === 'GET') {
				return handleGetPendingOrders(request, env);
			}

			// Duyệt đơn
			const approveMatch = path.match(/^\/api\/don-thue\/(\d+)\/approve$/);
			if (approveMatch && method === 'POST') {
				return handleApproveOrder(request, env, approveMatch[1]);
			}

			// Từ chối đơn
			const rejectMatch = path.match(/^\/api\/don-thue\/(\d+)\/reject$/);
			if (rejectMatch && method === 'POST') {
				return handleRejectOrder(request, env, rejectMatch[1]);
			}

			// Route đề bàn giao xe
			const handoverMatch = path.match(/^\/api\/don-thue\/(\d+)\/handover$/);
			if (handoverMatch && method === 'POST') {
				return handleVehicleHandover(request, env, handoverMatch[1]);
			}

			//Route để tiếp nhận trả xe
			const returnMatch = path.match(/^\/api\/don-thue\/(\d+)\/return$/);
			if (returnMatch && method === 'POST') {
				return handleVehicleReturn(request, env, returnMatch[1]);
			}

			// Route để quyết toán đơn thuê
			const finalizeMatch = path.match(/^\/api\/don-thue\/(\d+)\/finalize$/);
			if (finalizeMatch && method === 'POST') {
				return handleFinalizeOrder(request, env, finalizeMatch[1]);
			}

			// Route để lấy chi tiết đơn thuê
			if (path === '/api/orders' && method === 'GET') {
				return handleGetOrders(request, env);
			}
			const orderDetailMatch = path.match(/^\/api\/don-thue\/(\d+)$/);
			if (orderDetailMatch && method === 'GET') {
				const orderId = orderDetailMatch[1];
				return handleGetOrderDetails(request, env, orderId);
			}

			const depositConfirmMatch = path.match(/^\/api\/deposits\/(\d+)\/confirm$/);
			if (depositConfirmMatch && method === 'POST') {
				return handleConfirmDeposit(request, env, depositConfirmMatch[1]);
			}
			// Đang nhập
			if (path === '/login' && method === 'POST') {
				return getLogin(request, env);
			}

			// Route mặc định nếu không khớp
			return jsonResponse({ success: false, error: 'Route not found' }, 404);
		} catch (e: any) {
			console.error('API Error:', e);
			return jsonResponse({ success: false, error: e.message || 'Internal Server Error' }, 500);
		}
	},
};
