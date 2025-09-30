export interface Env {
	r2: R2Bucket;
	DB: D1Database;
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

/* ======================
   API BẢO TRÌ
====================== */

// Lấy danh sách tổng hợp bảo trì theo phương tiện
export async function getBaotriTongHop(request: Request, env: Env): Promise<Response> {
	try {
		const query = `
      SELECT 
        p.phuong_tien_id,
        p.ten_phuong_tien,
        COUNT(b.bao_tri_id) AS tong_so_bao_tri,
        SUM(b.chi_phi) AS tong_chi_phi,
        MAX(b.ngay_tao) AS ngay_tao_moi_nhat
      FROM BaoTri b
      JOIN PhuongTien p ON p.phuong_tien_id = b.phuong_tien_id
      GROUP BY p.phuong_tien_id, p.ten_phuong_tien
      ORDER BY ngay_tao_moi_nhat DESC
    `;
		const result = await env.DB.prepare(query).all();
		return withCORS({ success: true, data: result.results });
	} catch (error) {
		return withCORS({ success: false, error: 'Lỗi kết nối database' }, 500);
	}
}

// Lấy chi tiết bảo trì theo phương tiện
export async function getBaotriChiTiet(request: Request, env: Env, phuongTienId: number): Promise<Response> {
	try {
		const query = `
     SELECT 
  b.*,
  u.ho_ten AS ten_nguoi_tao,
  u.nguoi_dung_id AS nhan_vien_tao,  
  p.ten_phuong_tien
FROM BaoTri b
LEFT JOIN NguoiDung u ON b.nhan_vien_tao = u.nguoi_dung_id
LEFT JOIN PhuongTien p ON b.phuong_tien_id = p.phuong_tien_id
WHERE b.phuong_tien_id = ?
ORDER BY b.ngay_tao DESC

    `;
		const result = await env.DB.prepare(query).bind(phuongTienId).all();
		return withCORS({ success: true, data: result.results });
	} catch (error) {
		return withCORS({ success: false, error: 'Lỗi kết nối database' }, 500);
	}
}
//
// Lấy danh sách đơn thuê theo phương tiện
export async function getDonThueByPhuongTien(request: Request, env: Env, phuongTienId: number): Promise<Response> {
	try {
		const query = `
      SELECT 
        d.don_thue_id,
        d.ngay_bat_dau,
        d.ngay_ket_thuc,
        d.trang_thai,
        nd.ho_ten AS ten_khach_hang
      FROM DonThue d
      LEFT JOIN NguoiDung nd ON nd.nguoi_dung_id = d.khach_hang_id
      WHERE d.phuong_tien_id = ?
      ORDER BY d.ngay_bat_dau DESC
    `;
		const result = await env.DB.prepare(query).bind(phuongTienId).all();
		return withCORS({ success: true, data: result.results });
	} catch (error) {
		return withCORS({ success: false, error: 'Lỗi khi lấy đơn thuê' }, 500);
	}
}

// Thêm bảo trì
export async function addBaoTri(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCORS({ success: false, error: 'Method not allowed' }, 405);
	}

	try {
		const data: {
			phuong_tien_id: number;
			don_thue_id_lien_quan: number; // bắt buộc có
			mo_ta?: string;
			chi_phi?: number;
			trang_thai?: string;
			nhan_vien_tao: number;
		} = await request.json();

		const { phuong_tien_id, don_thue_id_lien_quan, mo_ta, chi_phi, trang_thai, nhan_vien_tao } = data;

		// Validate
		if (!don_thue_id_lien_quan) {
			return withCORS({ success: false, error: 'Đơn thuê liên quan là bắt buộc' }, 400);
		}

		// Kiểm tra phương tiện
		const checkPhuongTien = await env.DB.prepare('SELECT phuong_tien_id FROM PhuongTien WHERE phuong_tien_id = ?')
			.bind(phuong_tien_id)
			.first();

		if (!checkPhuongTien) {
			return withCORS({ success: false, error: 'Phương tiện không tồn tại' }, 400);
		}

		// Kiểm tra đơn thuê
		const checkDonThue = await env.DB.prepare('SELECT don_thue_id FROM DonThue WHERE don_thue_id = ?').bind(don_thue_id_lien_quan).first();

		if (!checkDonThue) {
			return withCORS({ success: false, error: 'Đơn thuê liên quan không tồn tại' }, 400);
		}

		// Kiểm tra nhân viên
		const checkNhanVien = await env.DB.prepare('SELECT nguoi_dung_id FROM NguoiDung WHERE nguoi_dung_id = ?').bind(nhan_vien_tao).first();

		if (!checkNhanVien) {
			return withCORS({ success: false, error: 'Nhân viên tạo không tồn tại trong bảng NguoiDung' }, 400);
		}

		// Thêm bản ghi
		const result = await env.DB.prepare(
			`INSERT INTO BaoTri 
			 (phuong_tien_id, don_thue_id_lien_quan, ngay_lich, mo_ta, chi_phi, trang_thai, nhan_vien_tao, ngay_tao, ngay_cap_nhat)
			 VALUES (?, ?, datetime('now'), ?, ?, ?, ?, datetime('now'), datetime('now'))`
		)
			.bind(phuong_tien_id, don_thue_id_lien_quan, mo_ta || '', chi_phi || 0, trang_thai || 'CHỜ_DUYỆT', nhan_vien_tao)
			.run();

		return withCORS({
			success: true,
			message: 'Thêm bảo trì thành công',
			bao_tri_id: result.meta.last_row_id,
		});
	} catch (error: any) {
		return withCORS({ success: false, error: 'Lỗi khi thêm: ' + error.message }, 500);
	}
}

// Cập nhật bảo trì
export async function updateBaotri(request: Request, env: Env, id: number): Promise<Response> {
    try {
        const body = (await request.json()) as { mo_ta?: string; chi_phi?: number; trang_thai?: string };

        const existing = await env.DB.prepare(
            `SELECT * FROM BaoTri WHERE bao_tri_id = ?`
        ).bind(id).first<{ bao_tri_id: number, phuong_tien_id: number, trang_thai: string, mo_ta: string, chi_phi: number }>();

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

        if (trang_thai === 'HOÀN_THÀNH' && existing.trang_thai !== 'HOÀN_THÀNH') {
            
            const updateBaoTriStmt = env.DB.prepare(
                `UPDATE BaoTri 
                 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = CURRENT_TIMESTAMP 
                 WHERE bao_tri_id = ?`
            ).bind(mo_ta, chi_phi, trang_thai, id);
            
            const updatePhuongTienStmt = env.DB.prepare(
                `UPDATE PhuongTien SET trang_thai = 'SAN_SANG' WHERE phuong_tien_id = ?`
            ).bind(phuongTienId);
            
            await env.DB.batch([updateBaoTriStmt, updatePhuongTienStmt]);

        } else {
            await env.DB.prepare(
                `UPDATE BaoTri 
                 SET mo_ta = ?, chi_phi = ?, trang_thai = ?, ngay_cap_nhat = CURRENT_TIMESTAMP 
                 WHERE bao_tri_id = ?`
            ).bind(mo_ta, chi_phi, trang_thai, id).run();
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
