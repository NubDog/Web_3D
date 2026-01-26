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
// Thêm mới bảo trì

export async function addBaoTri(request: Request, env: Env): Promise<Response> {
	try {
		const data = (await request.json()) as any;

		const phuong_tien_id = data.phuong_tien_id ?? null;
		const nhan_vien_tao = data.nhan_vien_tao ?? null;
		const mo_ta = data.mo_ta ?? 'Bảo trì định kỳ';
		const chi_phi = Number(data.chi_phi) || 0;
		const trang_thai = data.trang_thai ?? 'CHO_DUYET';
		const ngay_hien_tai = getNowVN();

		if (!phuong_tien_id || !nhan_vien_tao) {
			return withCORS({ success: false, error: 'Thiếu ID phương tiện hoặc ID nhân viên' }, 400);
		}

		const checkPhuongTien = await env.DB.prepare('SELECT trang_thai FROM PhuongTien WHERE phuong_tien_id = ?')
			.bind(phuong_tien_id)
			.first<{ trang_thai: string }>();

		if (!checkPhuongTien) return withCORS({ success: false, error: 'Phương tiện không tồn tại' }, 404);
		if (checkPhuongTien.trang_thai !== 'SAN_SANG') {
			return withCORS({ success: false, error: `Phương tiện đang ở trạng thái: ${checkPhuongTien.trang_thai}` }, 400);
		}

		const sqlInsert = `
            INSERT INTO BaoTri 
            (phuong_tien_id, ngay_lich, mo_ta, chi_phi, trang_thai, nhan_vien_tao, ngay_tao, don_thue_id_lien_quan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

		const insertStmt = env.DB.prepare(sqlInsert).bind(
			phuong_tien_id,
			ngay_hien_tai,
			mo_ta,
			chi_phi,
			trang_thai,
			nhan_vien_tao,
			ngay_hien_tai,
			null,
		);

		const updateStmt = env.DB.prepare("UPDATE PhuongTien SET trang_thai = 'BAO_TRI' WHERE phuong_tien_id = ?").bind(phuong_tien_id);

		await env.DB.batch([insertStmt, updateStmt]);

		return withCORS({ success: true, message: 'Thành công' });
	} catch (error: any) {
		console.error('D1 Error details:', error);
		return withCORS({ success: false, error: 'D1 Error: ' + error.message }, 500);
	}
}

// Cập nhật bảo trì
export async function updateBaotri(request: Request, env: Env, id: number): Promise<Response> {
	try {
		const body = (await request.json()) as {
			mo_ta?: string;
			chi_phi?: number;
			trang_thai?: string;
		};

		const existing = await env.DB.prepare(`SELECT * FROM BaoTri WHERE bao_tri_id = ?`).bind(id).first<{
			bao_tri_id: number;
			phuong_tien_id: number;
			trang_thai: string;
			mo_ta: string;
			chi_phi: number;
		}>();

		if (!existing) {
			return withCORS({ success: false, error: 'Không tìm thấy bản ghi bảo trì' }, 404);
		}

		const phuongTienId = existing.phuong_tien_id;
		if (!phuongTienId) {
			return withCORS(
				{
					success: false,
					error: 'Bản ghi bảo trì không liên kết với phương tiện nào.',
				},
				400,
			);
		}

		const mo_ta = body.mo_ta ?? existing.mo_ta;
		const chi_phi = body.chi_phi ?? existing.chi_phi;
		const trang_thai = body.trang_thai ?? existing.trang_thai;
		const thoiGianHienTai = getNowVN();

		if (trang_thai === 'DA_HOAN_THANH' && existing.trang_thai !== 'DA_HOAN_THANH') {
			// Lấy hạn bảo trì từ config
			const configResult = await env.DB.prepare(`SELECT han_bao_tri_phuong_tien FROM app_config LIMIT 1`).first<{
				han_bao_tri_phuong_tien: number;
			}>();
			const hanBaoTriMonths = configResult?.han_bao_tri_phuong_tien || 6;

			const updateBaoTriStmt = env.DB.prepare(
				`UPDATE BaoTri
				 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = ?
				 WHERE bao_tri_id = ?`,
			).bind(mo_ta, chi_phi, trang_thai, thoiGianHienTai, id);

			const updatePhuongTienStmt = env.DB.prepare(
				`UPDATE PhuongTien
				 SET trang_thai = 'SAN_SANG',
				     hanBaoTri = date(hanBaoTri, '+' || ? || ' months')
				 WHERE phuong_tien_id = ?`,
			).bind(hanBaoTriMonths, phuongTienId);

			await env.DB.batch([updateBaoTriStmt, updatePhuongTienStmt]);
		} else if (trang_thai === 'DA_HUY' && existing.trang_thai !== 'DA_HUY') {
			const updateBaoTriStmt = env.DB.prepare(
				`UPDATE BaoTri
				 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = ?
				 WHERE bao_tri_id = ?`,
			).bind(mo_ta, chi_phi, trang_thai, thoiGianHienTai, id);

			const updatePhuongTienStmt = env.DB.prepare(
				`UPDATE PhuongTien
				 SET trang_thai = 'SAN_SANG'
				 WHERE phuong_tien_id = ?`,
			).bind(phuongTienId);

			await env.DB.batch([updateBaoTriStmt, updatePhuongTienStmt]);
		} else {
			await env.DB.prepare(
				`UPDATE BaoTri
				 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = ?
				 WHERE bao_tri_id = ?`,
			)
				.bind(mo_ta, chi_phi, trang_thai, thoiGianHienTai, id)
				.run();
		}

		return withCORS({
			success: true,
			message: 'Cập nhật bảo trì thành công',
		});
	} catch (error: any) {
		return withCORS(
			{
				success: false,
				error: 'Lỗi khi cập nhật bảo trì: ' + error.message,
			},
			500,
		);
	}
}

// Xóa bảo trì
export async function deleteBaotri(request: Request, env: Env, id: number): Promise<Response> {
	try {
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
		const url = new URL(request.url);
		const status = url.searchParams.get('status');

		const validStatuses = ['CHO_DUYET', 'DA_DUYET', 'DA_HOAN_THANH', 'DA_HUY'];

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

		if (status && validStatuses.includes(status)) {
			query += ` WHERE d.trang_thai = '${status}'`;
		} else {
			query += ` WHERE d.trang_thai IN (${validStatuses.map((s) => `'${s}'`).join(',')})`;
		}

		query += ` ORDER BY d.ngay_tao DESC`;

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
			500,
		);
	}
}
// Các phương tiện tới hạn bảo trì
export async function getPhuongTienToiHanBaoTri(request: Request, env: Env): Promise<Response> {
	try {
		const query = `
			SELECT
				*,
				CASE
					WHEN hanBaoTri < date('now') THEN 'QUA_HAN'
					ELSE 'SAP_TOI_HAN'
				END AS tinh_trang_bao_tri
			FROM PhuongTien
			WHERE hanBaoTri IS NOT NULL
			  AND trang_thai NOT IN ('BAO_TRI', 'CHO_THUE')
			  AND hanBaoTri <= date('now', '+7 days')
			ORDER BY hanBaoTri ASC
		`;

		const { results } = await env.DB.prepare(query).all();

		return withCORS({
			success: true,
			data: results,
		});
	} catch (err: any) {
		return withCORS(
			{
				success: false,
				error: 'Lỗi khi lấy danh sách phương tiện quá hạn / sắp tới hạn bảo trì: ' + err.message,
			},
			500,
		);
	}
}
// hiện phương tiện ở trạng thái sẳng sàng để bảo trì
export async function getPhuongTienSanSang(request: Request, env: Env): Promise<Response> {
	try {
		const query = `
			SELECT *
			FROM PhuongTien
			WHERE trang_thai = 'SAN_SANG'
			ORDER BY phuong_tien_id ASC
		`;
		const { results } = await env.DB.prepare(query).all();
		return withCORS({
			success: true,
			data: results,
		});
	} catch (err: any) {
		return withCORS(
			{
				success: false,
				error: 'Lỗi khi lấy danh sách phương tiện sẵn sàng: ' + err.message,
			},
			500,
		);
	}
}
