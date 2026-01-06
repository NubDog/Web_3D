export interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
function getNowVN(): string {
	const now = new Date();
	const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
	return vnTime.toISOString().slice(0, 19).replace('T', ' ');
}
// Hàm hỗ trợ CORS
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

// Lấy danh sách tổng hợp bảo trì theo phương tiện
// export async function getBaotriTongHop(request: Request, env: Env): Promise<Response> {
// 	try {
// 		const query = `
//       SELECT
//         p.phuong_tien_id,
//         p.ten_phuong_tien,
//         COUNT(b.bao_tri_id) AS tong_so_bao_tri,
//         SUM(b.chi_phi) AS tong_chi_phi,
//         MAX(b.ngay_tao) AS ngay_tao_moi_nhat
//       FROM BaoTri b
//       JOIN PhuongTien p ON p.phuong_tien_id = b.phuong_tien_id
//       GROUP BY p.phuong_tien_id, p.ten_phuong_tien
//       ORDER BY ngay_tao_moi_nhat DESC
//     `;
// 		const result = await env.DB.prepare(query).all();
// 		return withCORS({ success: true, data: result.results });
// 	} catch (error) {
// 		return withCORS({ success: false, error: 'Lỗi kết nối database' }, 500);
// 	}
// }

// // Lấy danh sách đơn thuê theo phương tiện
// export async function getDonThueByPhuongTien(request: Request, env: Env, phuongTienId: number): Promise<Response> {
// 	try {
// 		const query = `
//       SELECT
//         d.don_thue_id,
//         d.ngay_bat_dau,
//         d.ngay_ket_thuc,
//         d.trang_thai,
//         nd.ho_ten AS ten_khach_hang
//       FROM DonThue d
//       LEFT JOIN NguoiDung nd ON nd.nguoi_dung_id = d.khach_hang_id
//       WHERE d.phuong_tien_id = ?
//       ORDER BY d.ngay_bat_dau DESC
//     `;
// 		const result = await env.DB.prepare(query).bind(phuongTienId).all();
// 		return withCORS({ success: true, data: result.results });
// 	} catch (error) {
// 		return withCORS({ success: false, error: 'Lỗi khi lấy đơn thuê' }, 500);
// 	}
// }

// // Lấy chi tiết bảo trì theo phương tiện
// export async function getBaotriChiTiet(request: Request, env: Env, phuongTienId: number): Promise<Response> {
// 	try {
// 		const query = `
//      SELECT
//   b.*,
//   u.ho_ten AS ten_nguoi_tao,
//   u.nguoi_dung_id AS nhan_vien_tao,
//   p.ten_phuong_tien
// FROM BaoTri b
// LEFT JOIN NguoiDung u ON b.nhan_vien_tao = u.nguoi_dung_id
// LEFT JOIN PhuongTien p ON b.phuong_tien_id = p.phuong_tien_id
// WHERE b.phuong_tien_id = ?
// ORDER BY b.ngay_tao DESC

//     `;
// 		const result = await env.DB.prepare(query).bind(phuongTienId).all();
// 		return withCORS({ success: true, data: result.results });
// 	} catch (error) {
// 		return withCORS({ success: false, error: 'Lỗi kết nối database' }, 500);
// 	}
// }
//

export async function addBaoTri(request: Request, env: Env): Promise<Response> {
	try {
		const data = (await request.json()) as any;

		// --- TRÍCH XUẤT VÀ KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
		// Ép kiểu về null hoặc giá trị mặc định ngay lập tức để tránh undefined
		const phuong_tien_id = data.phuong_tien_id ?? null;
		const nhan_vien_tao = data.nhan_vien_tao ?? null;
		const mo_ta = data.mo_ta ?? 'Bảo trì định kỳ';
		const chi_phi = Number(data.chi_phi) || 0;
		const trang_thai = data.trang_thai ?? 'CHO_DUYET';
		const ngay_hien_tai = getNowVN(); // Đảm bảo hàm này trả về string, không phải undefined

		// Kiểm tra các trường bắt buộc
		if (!phuong_tien_id || !nhan_vien_tao) {
			return withCORS({ success: false, error: 'Thiếu ID phương tiện hoặc ID nhân viên' }, 400);
		}

		// 1. Kiểm tra trạng thái xe
		const checkPhuongTien = await env.DB.prepare('SELECT trang_thai FROM PhuongTien WHERE phuong_tien_id = ?')
			.bind(phuong_tien_id)
			.first<{ trang_thai: string }>();

		if (!checkPhuongTien) return withCORS({ success: false, error: 'Xe không tồn tại' }, 404);
		if (checkPhuongTien.trang_thai !== 'SAN_SANG') {
			return withCORS({ success: false, error: `Xe đang ở trạng thái: ${checkPhuongTien.trang_thai}` }, 400);
		}

		// --- CHUẨN BỊ LỆNH SQL ---
		// Đảm bảo số lượng dấu ? khớp với bảng (Trong hình của bạn là 8 cột)
		const sqlInsert = `
            INSERT INTO BaoTri 
            (phuong_tien_id, ngay_lich, mo_ta, chi_phi, trang_thai, nhan_vien_tao, ngay_tao, don_thue_id_lien_quan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

		const insertStmt = env.DB.prepare(sqlInsert).bind(
			phuong_tien_id, // 1
			ngay_hien_tai, // 2
			mo_ta, // 3
			chi_phi, // 4
			trang_thai, // 5
			nhan_vien_tao, // 6
			ngay_hien_tai, // 7
			null // 8: don_thue_id_lien_quan luôn là null nếu không dùng
		);

		const updateStmt = env.DB.prepare("UPDATE PhuongTien SET trang_thai = 'BAO_TRI' WHERE phuong_tien_id = ?").bind(phuong_tien_id);

		// Chạy Batch
		await env.DB.batch([insertStmt, updateStmt]);

		return withCORS({ success: true, message: 'Thành công' });
	} catch (error: any) {
		// Log lỗi chi tiết ra console của Cloudflare để bạn debug
		console.error('D1 Error details:', error);
		return withCORS({ success: false, error: 'D1 Error: ' + error.message }, 500);
	}
}

// Cập nhật bảo trì
export async function updateBaotri(request: Request, env: Env, id: number): Promise<Response> {
	try {
		const body = (await request.json()) as { mo_ta?: string; chi_phi?: number; trang_thai?: string };

		const existing = await env.DB.prepare(`SELECT * FROM BaoTri WHERE bao_tri_id = ?`)
			.bind(id)
			.first<{ bao_tri_id: number; phuong_tien_id: number; trang_thai: string; mo_ta: string; chi_phi: number }>();

		if (!existing) {
			return withCORS({ success: false, error: 'Không tìm thấy bản ghi bảo trì' }, 404);
		}

		const phuongTienId = existing.phuong_tien_id;
		if (!phuongTienId) {
			return withCORS({ success: false, error: 'Bản ghi bảo trì không liên kết với phương tiện nào.' }, 400);
		}

		const mo_ta = body.mo_ta ?? existing.mo_ta;
		const chi_phi = body.chi_phi ?? existing.chi_phi;
		const trang_thai = body.trang_thai ?? existing.trang_thai;
		const thoiGianHienTai = getNowVN();

		if (trang_thai === 'DA_HOAN_THANH' && existing.trang_thai !== 'DA_HOAN_THANH') {
			const updateBaoTriStmt = env.DB.prepare(
				`UPDATE BaoTri 
                 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = ? 
                 WHERE bao_tri_id = ?`
			).bind(mo_ta, chi_phi, trang_thai, thoiGianHienTai, id);

			const updatePhuongTienStmt = env.DB.prepare(
				`UPDATE PhuongTien 
                 SET trang_thai = 'SAN_SANG', 
                     hanBaoTri = date(hanBaoTri, '+4 months') 
                 WHERE phuong_tien_id = ?`
			).bind(phuongTienId);

			await env.DB.batch([updateBaoTriStmt, updatePhuongTienStmt]);
		} else {
			await env.DB.prepare(
				`UPDATE BaoTri 
                 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = ? 
                 WHERE bao_tri_id = ?`
			)
				.bind(mo_ta, chi_phi, trang_thai, thoiGianHienTai, id)
				.run();
		}

		return withCORS({ success: true, message: 'Cập nhật bảo trì thành công' });
	} catch (error: any) {
		return withCORS({ success: false, error: 'Lỗi khi cập nhật bảo trì: ' + error.message }, 500);
	}
}
// Xóa bảo trì
export async function deleteBaotri(request: Request, env: Env, id: number): Promise<Response> {
	try {
		// Kiểm tra tồn tại
		const existing = await env.DB.prepare(`SELECT bao_tri_id FROM BaoTri WHERE bao_tri_id = ?`).bind(id).first();
		if (!existing) {
			return withCORS({ success: false, error: 'Không tìm thấy bản ghi' }, 404);
		}

		await env.DB.prepare(`DELETE FROM BaoTri WHERE bao_tri_id = ?`).bind(id).run();
		return withCORS({ success: true, message: 'Xóa thành công' });
	} catch (error: any) {
		return withCORS({ success: false, error: 'Lỗi khi xóa: ' + error.message }, 500);
	}
}
// Hiện chi tiết bảo trì
export async function getBaotrichitiet(request: Request, env: Env, id: number): Promise<Response> {
	try {
		const query = `SELECT c.* ,d.*,d.trang_thai as trang_thai_baotri ,nd.*,nd.trang_thai as trang_thai_nguoi_dung, pt.*, pt.trang_thai as trang_thai_phuong_tien
		FROM BaoTri d
		LEFT JOIN NguoiDung nd ON nd.nguoi_dung_id = d.nhan_vien_tao
		LEFT JOIN PhuongTien pt ON pt.phuong_tien_id = d.phuong_tien_id
		LEFT JOIN DonThue c ON c.don_thue_id = d.don_thue_id_lien_quan
		WHERE d.bao_tri_id = ?`;
		const result = await env.DB.prepare(query).bind(id).first();
		if (!result) {
			return withCORS({ success: false, error: 'Không tìm thấy bản ghi' }, 404);
		}
		return withCORS({ success: true, data: result });
	} catch (error: any) {
		return withCORS({ success: false, error: 'Lỗi khi lấy chi tiết bảo trì: ' + error.message }, 500);
	}
}
// Xem Bảo Trì Chờ Duyệt :
export async function getBaotri(request: Request, env: Env): Promise<Response> {
	try {
		// Lấy query param "status"
		const url = new URL(request.url);
		const status = url.searchParams.get('status');

		// Các trạng thái hợp lệ
		const validStatuses = ['CHO_DUYET', 'DA_DUYET', 'DA_HOAN_THANH', 'DA_HUY'];

		// Câu SQL cơ bản
		let query = `
			SELECT 
				d.*, 
				nd.ho_ten AS ten_nhan_vien, 
				pt.ten_phuong_tien, 
				c.don_thue_id
			FROM BaoTri d
			LEFT JOIN NguoiDung nd ON nd.nguoi_dung_id = d.nhan_vien_tao
			LEFT JOIN PhuongTien pt ON pt.phuong_tien_id = d.phuong_tien_id
			LEFT JOIN DonThue c ON c.don_thue_id = d.don_thue_id_lien_quan
		`;

		// Nếu có status hợp lệ → lọc theo trạng thái
		if (status && validStatuses.includes(status)) {
			query += ` WHERE d.trang_thai = '${status}'`;
		} else {
			// Nếu không có → lấy toàn bộ trạng thái hợp lệ
			query += ` WHERE d.trang_thai IN (${validStatuses.map((s) => `'${s}'`).join(',')})`;
		}

		query += ` ORDER BY d.ngay_tao DESC`;

		// Thực thi query
		const result = await env.DB.prepare(query).all();

		return withCORS({
			success: true,
			data: result.results,
		});
	} catch (error: any) {
		return withCORS(
			{
				success: false,
				error: 'Lỗi khi lấy danh sách bảo trì: ' + error.message,
			},
			500
		);
	}
}
// Các phương tiện tới hạn bảo trì
export async function getPhuongTienToiHanBaoTri(request: Request, env: Env): Promise<Response> {
	try {
		const query = `
			SELECT *
			FROM PhuongTien
			WHERE hanBaoTri IS NOT NULL
			  AND trang_thai != 'BAO_TRI' 
			  AND trang_thai != 'CHO_THUE'
			  AND hanBaoTri BETWEEN date('now') AND date('now', '+7 days')
			ORDER BY hanBaoTri ASC
		`;

		const { results } = await env.DB.prepare(query).all();

		return withCORS({ success: true, data: results });
	} catch (err: any) {
		return withCORS(
			{
				success: false,
				error: 'Lỗi khi lấy danh sách phương tiện gần tới hạn bảo trì: ' + err.message,
			},
			500
		);
	}
}
