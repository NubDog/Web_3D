import { GoogleGenerativeAI } from '@google/generative-ai';
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
import { handleCheckUserStatus, handleGetKhachHang } from './API/KhachHang_API';
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
	handleCheckOrderViolation,
	handleRejectOrderLevel3,
	getOverdueOrders,
} from './Admin/don-thue';
import { handleVehicleHandover, handleVehicleReturn } from './Admin/giao-nhan';
import { handleFinalizeOrder } from './Admin/quyet-toan';
import { handleConfirmDeposit } from './Admin/tien_coc';
import { getLogin } from './Admin/Login';
import { handleCreateViolation, handleGetViolations, handleUpdateViolation, handleDeleteViolation, handleCheckCustomerViolations, handleGetCustomerViolationHistory, handleBatchCheckViolations, handleConfirmViolationPayment, handleGetUserViolations } from './Admin/vi-pham';
import { addhieupt, deletehieupt, gethieupt, updatehieupt } from './Admin/Hieu-phuong-tien';
import {
	addBaoTri,
	deleteBaotri,
	getBaotri,
	getBaotrichitiet,
	// getBaotriChiTiet,
	// getBaotrichoduyet,
	// getBaotriTongHop,
	// getDonThueByPhuongTien,
	getPhuongTienToiHanBaoTri,
	updateBaotri,
	getPhuongTienSanSang,
} from './Admin/Bao-tri';
import { handleScheduled } from './worker';
import { getToken, getUserWEmail, verifyTokenAndUpdatePassword } from './API/Forgot_password_API';
import { addPhanloaihieuxe, deletePhanloaihieuxe, getPhanloaihieuxe, updatePhanloaihieuxe } from './Admin/Phan_loai_hieu_xe';
import { handleGetConfig, handleSaveConfig } from './Config-Handler/configHandler'

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
	VECTORIZE: VectorizeIndex;
	GEMINI_API_KEY: string;
	hd: R2Bucket;
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

		const headers = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

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

			// ------------------- Trang chủ -------------------
			if (path === '/' && method === 'GET') {
				return new Response('API Thuê Xe đang chạy ngon lành!', { status: 200 });
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

			// ------------------- API Tìm kiếm Vector -------------------
			if (path === '/search' && method === 'GET') {
				const question = url.searchParams.get('q');
				if (!question) {
					return jsonResponse({ error: 'Thiếu câu hỏi (tham số ?q=...)' }, 400);
				}

				try {
					const apiKey = env.GEMINI_API_KEY;
					const genAI = new GoogleGenerativeAI(apiKey);

					// 1. Model Embed (để tìm xe)
					const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
					// const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Đưa vào loop fallback rồi

					// --- BƯỚC 1: TÌM XE ---
					const result = await embedModel.embedContent(question);
					const userVector = result.embedding.values;

					// 3. So khớp với Database Vectorize
					const matches = await env.VECTORIZE.query(userVector, {
						topK: 3, // Lấy 3 xe giống nhất
						returnMetadata: true,
					});

					// --- BƯỚC 2: TỔNG HỢP DỮ LIỆU ---
					// Gom thông tin xe tìm được thành 1 cục text
					const contextData = matches.matches
						.map((m) => {
							const xe = m.metadata as any; // Ép kiểu lấy data
							return `- Xe: ${xe.name}\n  + Thông tin: ${xe.text}\n  + Ảnh: ${xe.image}`;
						})
						.join('\n\n');

					// --- BƯỚC 3: HỎI GEMINI ---
					const prompt = `
						Bạn là nhân viên tư vấn của Shark Eat Rice. Hãy trả lời câu hỏi của khách hàng dựa trên thông tin xe dưới đây.
						
						THÔNG TIN XE TÌM ĐƯỢC TRONG KHO:
						${contextData}
						
						CÂU HỎI CỦA KHÁCH: "${question}"
						
						YÊU CẦU:
						1. Trả lời thân thiện, ngắn gọn, tự nhiên như người Việt Nam.
						2. Chỉ giới thiệu các xe có trong danh sách trên.
						3. Cuối câu trả lời, hãy chốt bằng một câu mời gọi đặt xe.
						4. Đừng nhắc đến ID hay thông tin kỹ thuật khô khan nếu khách không hỏi.
						5. Nếu khách không hỏi những gì liên quan đến xe thì bạn chỉ cần trả lời sao cho sát với câu hỏi của khách hàng nhất (ví dụ khách chào bạn thì bạn sẻ chào lại khách đừng nói dài lam man).
						6. Khi giới thiệu sản phẩm bạn hãy giới thiệu tối đa 2 sản phẩm liên quan nhất mà khách đề cập và chỉ giới thiệu tên  giá thuê và công năng công dụng cũng như điểm mạnh của nó.
						7. Khi xưng hô với khách thì hãy dùng tên là "Shark Eat Rice" hoặc là "em"
						8. Nếu khách có yêu cầu xem ảnh thì bạn hãy show ra hình ảnh luôn còn nếu khách không có nhu cầu xem ảnh thì không được show
					`;

					// --- BƯỚC 3: HỎI GEMINI (CÓ FALLBACK) ---
					const models = [
						"gemini-flash-latest",
						"gemini-2.0-flash",
						"gemini-2.5-flash-lite",
						"gemini-pro-latest",
						"gemini-2.5-flash"
					];

					let textResponse = "";
					const errorLogs: string[] = [];

					for (const modelName of models) {
						try {
							// console.log(`Thử model: ${modelName}`);
							const chatModel = genAI.getGenerativeModel({ model: modelName });
							const chatResult = await chatModel.generateContent(prompt);
							textResponse = chatResult.response.text();
							if (textResponse) break; // Ngon, thoát vòng lặp
						} catch (error: any) {
							console.error(`Error with model ${modelName}:`, error.message);
							errorLogs.push(`Model ${modelName} failed: ${error.message}`);
							// Thử model tiếp theo
						}
					}

					if (!textResponse) {
						throw new Error("All AI models failed. Details:\n" + errorLogs.join("\n"));
					}

					// 4. Trả kết quả JSON
					return jsonResponse({
						answer: textResponse, // Câu trả lời của AI
						cars: matches.matches.map((match) => match.metadata), // Data xe để hiện thẻ card
					});
				} catch (error: any) {
					return jsonResponse({ error: error.message }, 500);
				}
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
			const emailMatch = path.match(/^\/api\/quen-mat-khau\/([^/]+)$/);
			if (emailMatch && method === 'GET') {
				const email = decodeURIComponent(emailMatch[1]);
				return getUserWEmail(request, env, email);
			}

			if (path === '/api/yeu-cau-reset' && method === 'POST') {
				try {
					const body: any = await request.json();
					const email = body.email;
					if (!email) {
						return new Response('Thiếu email gửi lên', { status: 400 });
					}
					return getToken(request, env, email);
				} catch (e) {
					return new Response('Lỗi đọc JSON', { status: 400 });
				}
			}
			if (path === '/api/xac-nhan-doi-mat-khau' && method === 'POST') {
				return verifyTokenAndUpdatePassword(request, env);
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

			// ------------------- Phân loại hiệu xe -------------------
			if (path === '/api/phan-loai-hieu-xe' && method === 'GET') {
				return getPhanloaihieuxe(request, env);
			}
			if (path === '/api/phan-loai-hieu-xe' && method === 'POST') {
				return addPhanloaihieuxe(request, env);
			}
			if (path.match(/^\/api\/phan-loai-hieu-xe\/\d+$/) && method === 'PUT') {
				const id = path.split('/')[3];
				return updatePhanloaihieuxe(request, env, Number(id));
			}
			if (path.match(/^\/api\/phan-loai-hieu-xe\/\d+$/) && method === 'DELETE') {
				const id = path.split('/')[3];
				return deletePhanloaihieuxe(request, env, Number(id));
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

			if (url.pathname.startsWith('/api/check-user-status/')) {
				const userId = url.pathname.split('/').pop();
				return handleCheckUserStatus(request, env, userId as string);
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
				const id = url.pathname.split('/')[3];
				return handleSettleOrder(request, env, id);
			}

			if (request.method === 'POST' && url.pathname.match(/^\/api\/don-thue\/\d+\/confirm-payment$/)) {
				const id = url.pathname.split('/')[3];
				return handleConfirmPayment(request, env, id);
			}

			if (path.match(/^\/api\/don-thue\/(\d+)\/check-violation$/)) {
				const orderId = path.split('/')[3];
				return handleCheckOrderViolation(request, env, orderId);
			}
			if (path.match(/^\/api\/don-thue\/(\d+)\/reject$/) && request.method === 'POST') {
				const orderId = path.split('/')[3];
				return handleRejectOrderLevel3(request, env, orderId);
			}

			const confirmViolationPaymentMatch = path.match(/^\/api\/don-thue\/(\d+)\/confirm-violation-payment$/);
			if (confirmViolationPaymentMatch && method === 'POST') {
				const orderId = confirmViolationPaymentMatch[1];
				return handleConfirmViolationPayment(request, env, orderId);
			}

			if (url.pathname === '/api/orders/overdue' && request.method === 'GET') {
				return getOverdueOrders(request, env);
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
			if (path.match(/^\/api\/customers\/(\d+)\/violations\/check$/) && method === 'GET') {
				const khachHangId = path.match(/^\/api\/customers\/(\d+)\/violations\/check$/)![1];
				return handleCheckCustomerViolations(request, env, khachHangId);
			}
			if (path === '/api/violations/batch-check' && method === 'POST') {
				return handleBatchCheckViolations(request, env);
			}

			// ✅ API lấy lịch sử vi phạm đầy đủ
			if (path.match(/^\/api\/customers\/(\d+)\/violations\/history$/) && method === 'GET') {
				const khachHangId = path.match(/^\/api\/customers\/(\d+)\/violations\/history$/)![1];
				return handleGetCustomerViolationHistory(request, env, khachHangId);
			}

			if (url.pathname === '/api/user-violations' && request.method === 'GET') {
				return handleGetUserViolations(request, env);
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
			if (path.startsWith('/api/baotri/') && method === 'PUT') {
				const id = parseInt(path.split('/').pop() || '0', 10);
				return updateBaotri(request, env, id);
			}
			if (path.startsWith('/api/baotri/') && method === 'DELETE') {
				const id = parseInt(path.split('/').pop() || '0', 10);
				return deleteBaotri(request, env, id);
			}
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
			if (path === '/api/baotri/getdsptsangsang' && method === 'GET') {
				return getPhuongTienSanSang(request, env);
			}

			// config

			if (url.pathname === '/api/config/current' && request.method === 'GET') {
				const response = await handleGetConfig(env);
				return new Response(response.body, {
					status: response.status,
					headers,
				});
			}

			if (url.pathname === '/api/config/save' && request.method === 'POST') {
				const response = await handleSaveConfig(request, env);
				return new Response(response.body, {
					status: response.status,
					headers,
				});
			}

			// ------------------- Default -------------------
			return jsonResponse({ success: false, error: 'Route not found' }, 404);
		} catch (e: any) {
			console.error('API Error:', e);
			return jsonResponse({ success: false, error: e.message || 'Internal Server Error' }, 500);
		}
	},
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		return handleScheduled(event, env, ctx);
	},
};
