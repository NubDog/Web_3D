interface Env {
	DB: D1Database;
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

export const handleGetKycDocumentsByNguoiDungId = async (request: Request, env: Env, nguoi_dung_id: string) => {
    try {
        const idAsNumber = parseInt(nguoi_dung_id, 10);
        if (isNaN(idAsNumber)) {
            return jsonResponse({ success: false, error: 'ID người dùng không hợp lệ' }, 400);
        }

        const khachHangQuery = "SELECT khach_hang_id FROM KhachHang WHERE nguoi_dung_id = ?";
        const khachHangResult = await env.DB.prepare(khachHangQuery).bind(idAsNumber).first<{ khach_hang_id: number }>();

        if (!khachHangResult) {
            return jsonResponse({ success: false, error: 'Không tìm thấy khách hàng cho người dùng này' }, 404);
        }

        const khach_hang_id = khachHangResult.khach_hang_id;

        const taiLieuQuery = "SELECT * FROM TaiLieuKYC WHERE khach_hang_id = ?";
        const { results } = await env.DB.prepare(taiLieuQuery).bind(khach_hang_id).all();

        return jsonResponse({ success: true, data: results });

    } catch (e: any) {
        console.error("Đã có lỗi xảy ra:", e);
        return jsonResponse({ success: false, error: 'Lỗi truy vấn dữ liệu KYC', details: e.message }, 500);
    }
};

export const handleCheckStatusKYC = async (request: Request, env: Env) => {
    try {
        const url = new URL(request.url);
        const nguoi_dung_id = url.searchParams.get('userId');

        if (!nguoi_dung_id) {
            return jsonResponse({ success: false, error: 'Thiếu User ID' }, 400);
        }

        const khachHang = await env.DB.prepare("SELECT khach_hang_id FROM KhachHang WHERE nguoi_dung_id = ?")
            .bind(nguoi_dung_id)
            .first<{ khach_hang_id: number }>();

        if (!khachHang) {
            return jsonResponse({ success: true, hasKYC: false });
        }

        const taiLieu = await env.DB.prepare("SELECT COUNT(*) as count FROM TaiLieuKYC WHERE khach_hang_id = ?")
            .bind(khachHang.khach_hang_id)
            .first<{ count: number }>();
        
        const hasKYC = (taiLieu?.count || 0) > 0;

        return jsonResponse({ success: true, hasKYC: hasKYC });

    } catch (e: any) {
        console.error("Lỗi check KYC:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};
