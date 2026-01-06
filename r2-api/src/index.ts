import { handleGetUsers, handleCreateUser, handleUpdateUser, handleDeleteUser, handleToggleUserStatus } from './Admin/admin-users';
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
import { handleGetNguoiDung, handleCreateNguoiDung, handleLogin } from './API/NguoiDung_API';
import { handleGetDonThue } from './API/DonThue_API';
import { handleGetKhachHang } from './API/KhachHang_API';
import { handleGetUserProfile, handleUpdateUserProfile, handleChangePassword } from './API/UserProfile_API';
import { handleGetKycDocumentsByNguoiDungId, handleCheckStatusKYC } from './API/KYC_User';
import { handleGetUserOrders } from './API/UserOrder_API';
import { handleGetUserContract } from './API/UserContract';
import { handleGetFile, handleUploadFile, handleListFiles, handleDeleteFile, handleGetProductImage } from './r2-handler';
import {
	handleCreateRentalOrder,
	handleGetPendingOrders,
	handleApproveOrder,
	handleRejectOrder,
	handleGetOrders,
	handleGetOrderDetails,
	handleCancelOrder,
	handleSettleOrder,
	handleConfirmPayment,
} from './Admin/don-thue';
import { handleVehicleHandover, handleVehicleReturn } from './Admin/giao-nhan';
import { handleFinalizeOrder } from './Admin/quyet-toan';
import { handleConfirmDeposit } from './Admin/tien_coc';
import { getLogin } from './Admin/Login';
import { handleCreateViolation, handleGetViolations, handleUpdateViolation, handleDeleteViolation } from './Admin/vi-pham';
import { addhieupt, deletehieupt, gethieupt, updatehieupt } from './Admin/Hieu-phuong-tien';
import {
	addBaoTri,
	deleteBaotri,
	getBaotri,
	getBaotrichitiet,
	getBaotriChiTiet,
	// getBaotrichoduyet,
	getBaotriTongHop,
	getDonThueByPhuongTien,
	getPhuongTienToiHanBaoTri,
	updateBaotri,
} from './Admin/Bao-tri';

interface Env {
	ua: R2Bucket;
	r2: R2Bucket;
	DB: D1Database;
	rental_db: D1Database;
	kyc: R2Bucket;
	product: R2Bucket;
	ICC: R2Bucket;
	RESEND_API_KEY: string;
	VIO: R2Bucket;
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
			// ------------------- Upload & File -------------------
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

			// ------------------- API PhuongTien -------------------
			if (path === '/api/phuong-tien' && method === 'GET') {
				return handleGetPhuongTien(request, env);
			}

			// ------------------- API ChinhSachGia -------------------
			if (path === '/api/chinh-sach-gia' && method === 'GET') {
				return handleGetChinhSachGia(request, env);
			}

			// ------------------- API DonThue -------------------
			if (path === '/api/don-thue-data' && method === 'GET') {
				return handleGetDonThue(request, env);
			}

			// ------------------- API NguoiDung -------------------
			if (path === '/api/nguoi-dung') {
				if (method === 'GET') {
					return handleGetNguoiDung(request, env);
				}
				if (method === 'POST') {
					return handleCreateNguoiDung(request, env);
				}
			}

			if (url.pathname === '/api/user/check-kyc' && request.method === 'GET') {
				return handleCheckStatusKYC(request, env);
			}

			// ------------------- API KhachHang -------------------
			if (path === '/api/khach-hang' && method === 'GET') {
				return handleGetKhachHang(request, env);
			}

			// ------------------- Test kết nối -------------------
			if (path === '/test-r2' && request.method === 'GET') {
				try {
					const listResponse = await env.r2.list();
					return Response.json({
						success: true,
						message: 'Kết nối R2 thành công',
						objects: listResponse.objects,
					});
				} catch (err: any) {
					return Response.json({ success: false, error: 'Kết nối R2 thất bại: ' + err.message }, { status: 500 });
				}
			}

			if (path === '/test-db' && request.method === 'GET') {
				try {
					const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
					return Response.json({ success: true, message: 'Kết nối DB thành công', tables: results });
				} catch (err: any) {
					return Response.json({ success: false, error: 'Kết nối DB thất bại: ' + err.message }, { status: 500 });
				}
			}

			// ------------------- KYC -------------------
			const kycListMatch = path.match(/^\/api\/customers\/(\d+)\/kyc$/);
			if (kycListMatch && method === 'GET') {
				const customerId = kycListMatch[1];
				return handleGetKycDocuments(env, customerId);
			}
			const kycUserMatch = path.match(/^\/api\/kyc\/user\/(\d+)$/);
			if (kycUserMatch && method === 'GET') {
				const nguoiDungId = kycUserMatch[1];
				return handleGetKycDocumentsByNguoiDungId(request, env, nguoiDungId);
			}
			const kycCccdSetMatch = path.match(/^\/api\/kyc\/cccd\/(\d+)$/);
			if (kycCccdSetMatch && method === 'PUT') {
				const customerId = kycCccdSetMatch[1];
				return handleUpdateCccdSet(request, env, customerId);
			}
			if (path === '/api/kyc' && method === 'POST') {
				return handleAddKycDocument(request, env);
			}

			// ------------------- User -------------------
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

			// ------------------- Phương tiện -------------------
			if (path === '/Admin/phuong-tien' && request.method === 'POST') {
				return PhuongTien.addphuongtien(request, env);
			}
			if (path.startsWith('/Admin/phuong-tien/') && request.method === 'PUT') {
				const id = path.split('/')[3];
				if (id) return PhuongTien.updatePhuongTien(request, env, id);
			}
			if (path.startsWith('/Admin/phuong-tien/') && request.method === 'DELETE') {
				const id = path.split('/')[3];
				if (id) return PhuongTien.deletePhuongTien(request, env, id);
			}
			const phuongTienIdMatch = path.match(/^\/Admin\/phuong-tien\/(\d+)$/);
			if (phuongTienIdMatch) {
				const id = phuongTienIdMatch[1];
				return PhuongTien.getPhuongTienById(request, env, id);
			}
			if (path.startsWith('/Admin/phuong-tien')) {
				return PhuongTien.getPhuongTiens(request, env);
			}

			// ------------------- Hiệu Phương Tiện ------------
			if (path === '/api/hieu-phuong-tien' && method === 'GET') {
				return gethieupt(request, env);
			}
			if (path === '/api/hieu-phuong-tien' && method === 'POST') {
				return addhieupt(request, env);
			}
			if (path.match(/^\/api\/hieu-phuong-tien\/\d+$/) && method === 'PUT') {
				const id = path.split('/')[3];
				return updatehieupt(request, env, Number(id));
			}
			if (path.match(/^\/api\/hieu-phuong-tien\/\d+$/) && method === 'DELETE') {
				const id = path.split('/')[3];
				return deletehieupt(request, env, Number(id));
			}

			// ------------------- Customers -------------------
			if (path.startsWith('/api/customers')) {
				const byUserMatch = path.match(/^\/api\/customers\/by-user\/([^\/]+)/);
				if (byUserMatch && method === 'GET') {
					const userId = byUserMatch[1];
					return handleGetCustomerByUserId(env, userId);
				}
				const detailMatch = path.match(/^\/api\/customers\/([^\/]+)/);
				if (detailMatch) {
					const customerId = detailMatch[1];
					if (method === 'GET') return handleGetCustomerById(env, customerId);
					if (method === 'PUT') return handleUpdateCustomer(request, env, customerId);
				}
				if (path === '/api/customers' && method === 'GET') {
					return handleGetCustomers(env);
				}
			}

			// ------------------- Danh mục phương tiện -------------------
			const danhMucIdMatch = path.match(/^\/api\/danh-muc-phuong-tien\/(\d+)$/);
			if (danhMucIdMatch) {
				const id = danhMucIdMatch[1];
				if (method === 'GET') return getDanhmucphuongtienid(request, env, id);
				if (method === 'DELETE') return deleteDanhmucphuongtien(request, env, id);
				if (method === 'PUT') return putDanhmucphuongtien(request, env, id);
			} else if (path === '/api/danh-muc-phuong-tien') {
				if (method === 'GET') return getDanhmucphuongtiens(request, env);
				if (method === 'POST') return Adddanhmucphuongtien(request, env);
			}

			// ------------------- Chính sách giá -------------------
			const chinhSachIdMatch = path.match(/^\/Admin\/chinh-sach-gia\/(\d+)$/);
			if (chinhSachIdMatch) {
				const id = chinhSachIdMatch[1];
				if (method === 'PUT') return updateChinhSachGia(request, env, id);
				if (method === 'DELETE') return deleteChinhSachGia(request, env, id);
			} else if (path === '/Admin/chinh-sach-gia') {
				if (method === 'GET') return getChinhSachGias(request, env);
				if (method === 'POST') return addChinhSachGia(request, env);
			}

			// ------------------- Product image -------------------
			const productImageMatch = path.match(/^\/product-image\/(.+)/);
			if (productImageMatch && method === 'GET') {
				const key = decodeURIComponent(productImageMatch[1]);
				return handleGetProductImage(request, env, key);
			}

			// ------------------- Đơn thuê -------------------
			if (path === '/api/don-thue' && method === 'POST') {
				return handleCreateRentalOrder(request, env);
			}
			if (path === '/api/don-thue/pending' && method === 'GET') {
				return handleGetPendingOrders(request, env);
			}
			const approveMatch = path.match(/^\/api\/don-thue\/(\d+)\/approve$/);
			if (approveMatch && method === 'POST') {
				return handleApproveOrder(request, env, approveMatch[1]);
			}
			const rejectMatch = path.match(/^\/api\/don-thue\/(\d+)\/reject$/);
			if (rejectMatch && method === 'POST') {
				return handleRejectOrder(request, env, rejectMatch[1]);
			}
			const handoverMatch = path.match(/^\/api\/don-thue\/(\d+)\/handover$/);
			if (handoverMatch && method === 'POST') {
				return handleVehicleHandover(request, env, handoverMatch[1]);
			}
			const returnMatch = path.match(/^\/api\/don-thue\/(\d+)\/return$/);
			if (returnMatch && method === 'POST') {
				return handleVehicleReturn(request, env, returnMatch[1]);
			}
			const finalizeMatch = path.match(/^\/api\/don-thue\/(\d+)\/finalize$/);
			if (finalizeMatch && method === 'POST') {
				return handleFinalizeOrder(request, env, finalizeMatch[1]);
			}
			if (path === '/api/orders' && method === 'GET') {
				return handleGetOrders(request, env);
			}
			const cancelMatch = path.match(/^\/api\/don-thue\/(\d+)\/cancel$/);
			if (cancelMatch && method === 'POST') {
				return handleCancelOrder(request, env, cancelMatch[1]);
			}
			const orderDetailMatch = path.match(/^\/api\/don-thue\/(\d+)$/);
			if (orderDetailMatch && method === 'GET') {
				const orderId = orderDetailMatch[1];
				return handleGetOrderDetails(request, env, orderId);
			}
			const confirmDepositMatch = path.match(/^\/api\/don-thue\/(\d+)\/confirm-deposit$/);
			if (confirmDepositMatch && method === 'POST') {
				const orderId = confirmDepositMatch[1];
				return handleConfirmDeposit(request, env, orderId);
			}
			if (request.method === 'POST' && url.pathname.match(/^\/api\/don-thue\/\d+\/settle$/)) {
				const id = url.pathname.split('/')[3]; // Lấy ID đơn hàng (số 7 trong log)
				return handleSettleOrder(request, env, id);
			}

			// 2. Route cho bước Xác nhận thu tiền (Hoàn tất)
			// Frontend gọi: /api/don-thue/:id/confirm-payment
			if (request.method === 'POST' && url.pathname.match(/^\/api\/don-thue\/\d+\/confirm-payment$/)) {
				const id = url.pathname.split('/')[3];
				return handleConfirmPayment(request, env, id);
			}

			// ------------------- Vi phạm -------------------
			if (path === '/api/violations' && method === 'POST') {
				return handleCreateViolation(request, env);
			}
			if (path === '/api/violations' && method === 'GET') {
				return handleGetViolations(request, env);
			}
			const violationMatch = path.match(/^\/api\/violations\/(\d+)$/);
			if (violationMatch && method === 'PUT') {
				const violationId = violationMatch[1];
				return handleUpdateViolation(request, env, violationId);
			}
			if (violationMatch && method === 'DELETE') {
				const violationId = violationMatch[1];
				return handleDeleteViolation(request, env, violationId);
			}

			// ------------------- User Profile -------------------
			if (path === '/api/user-profile' && method === 'GET') {
				return handleGetUserProfile(request, env);
			}
			const userProfileMatch = path.match(/^\/api\/user-profile\/(\d+)$/);
			if (userProfileMatch && method === 'PUT') {
				return handleUpdateUserProfile(request, env);
			}
			if (path === '/api/user-profile/change-password' && method === 'PUT') {
				return handleChangePassword(request, env);
			}

			// ------------------- User Orders -------------------
			if (path === '/api/user-orders' && method === 'GET') {
				return handleGetUserOrders(request, env);
			}

			// ------------------- User Hợp Đồng -------------------
			if (path === '/api/user-hop-dong' && method === 'GET') {
				return handleGetUserContract(request, env);
			}

			// ------------------- Login -------------------
			if (path === '/login' && method === 'POST') {
				return getLogin(request, env);
			}
			if (path === '/api/login' && method === 'POST') {
				return handleLogin(request, env);
			}

			// ------------------- Bảo trì -------------------
			// if (path === '/api/baotri/tonghop' && method === 'GET') {
			// 	return getBaotriTongHop(request, env);
			// }
			// if (path.startsWith('/api/baotri/chitiet/') && method === 'GET') {
			// 	const phuongTienId = parseInt(path.split('/').pop() || '0', 10);
			// 	return getBaotriChiTiet(request, env, phuongTienId);
			// }
			// if (path === '/api/baotri' && method === 'POST') {
			// 	return addBaoTri(request, env);
			// }
			if (path.startsWith('/api/baotri/') && method === 'PUT') {
				const id = parseInt(path.split('/').pop() || '0', 10);
				return updateBaotri(request, env, id);
			}
			if (path.startsWith('/api/baotri/') && method === 'DELETE') {
				const id = parseInt(path.split('/').pop() || '0', 10);
				return deleteBaotri(request, env, id);
			}
			// if (path.startsWith('/Admin/don-thue') && method === 'GET') {
			// 	const url = new URL(request.url);
			// 	const phuongTienId = url.searchParams.get('phuong_tien_id');
			// 	return getDonThueByPhuongTien(request, env, phuongTienId ? parseInt(phuongTienId, 10) : 0);
			// }
			const baotrichitiet = path.match(/^\/Admin\/baotri\/chitiet\/(\d+)$/);
			if (baotrichitiet && method === 'POST') {
				const baoTriId = parseInt(baotrichitiet[1], 10);
				return getBaotrichitiet(request, env, baoTriId);
			}
			if (path === '/Admin/baotri' && method === 'GET') {
				return getBaotri(request, env);
			}
			if (path === '/api/baotri/hanbaotri' && method === 'GET') {
				return getPhuongTienToiHanBaoTri(request, env);
			}
			if (path === '/api/baotri/addbaotri' && method === 'POST') {
				return addBaoTri(request, env);
			}

			// ------------------- Default -------------------
			return jsonResponse({ success: false, error: 'Route not found' }, 404);
		} catch (e: any) {
			console.error('API Error:', e);
			return jsonResponse({ success: false, error: e.message || 'Internal Server Error' }, 500);
		}
	},
};
