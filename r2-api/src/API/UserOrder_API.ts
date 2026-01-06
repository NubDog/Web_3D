interface Env {
    DB: D1Database;
}

/**
 * Hàm helper để trả về phản hồi JSON với các header CORS mặc định
 */
const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * API lấy thông tin đơn thuê của user đang đăng nhập
 * Cần truyền nguoi_dung_id qua query parameter: ?nguoi_dung_id=123
 */
export async function handleGetUserOrders(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const nguoiDungId = url.searchParams.get('nguoi_dung_id');

    if (!nguoiDungId) {
        return jsonResponse({ success: false, error: 'Thiếu thông tin nguoi_dung_id.' }, 400);
    }

  try {
       const query = `
            SELECT 
                dt.don_thue_id,
                dt.ngay_bat_dau,
                dt.ngay_ket_thuc,
                dt.dia_diem_nhan,
                dt.dia_diem_tra,
                dt.tong_tien,
                dt.tien_coc_yeu_cau,
                dt.ghi_chu,
                dt.ngay_tao,
                pt.ten_phuong_tien,
                hd.duong_dan_file AS hop_dong_url,

                pt.gia_thue,           
                cs.ty_le_giam,         
                cs.ten_chinh_sach,     
                tc.trang_thai as trang_thai_coc,
                tc.ngay_giu as ngay_duyet_coc,               

                CASE 
                   
                    WHEN dt.trang_thai IN ('DANG_THUE', 'DA_TRA', 'CHO_THANH_TOAN', 'HOAN_THANH', 'DA_HUY') THEN dt.trang_thai
                    
                 
                    WHEN dt.trang_thai = 'DA_DUYET' AND tc.trang_thai IN ('DA_NHAN', 'DA_THANH_TOAN', 'DANG_GIU') THEN 'DA_COC'
                    
                    ELSE dt.trang_thai 
                END AS trang_thai,
                
                dt.tong_tien AS tong_tien_thuc_te

            FROM DonThue dt
            JOIN KhachHang kh ON dt.khach_hang_id = kh.khach_hang_id
            JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
            JOIN ChinhSachGia cs ON dt.chinh_sach_id = cs.chinh_sach_id
            LEFT JOIN HopDong hd ON dt.don_thue_id = hd.don_thue_id
            LEFT JOIN TienCoc tc ON dt.don_thue_id = tc.don_thue_id
            WHERE kh.nguoi_dung_id = ?
            ORDER BY dt.ngay_tao DESC
        `;
        const { results } = await env.DB.prepare(query).bind(nguoiDungId).all();

        return jsonResponse({
            success: true,
            data: results,
        });

    } catch (e: any) {
        console.error("SQL Error:", e);
        return jsonResponse({ success: false, error: 'Lỗi truy vấn dữ liệu: ' + e.message }, 500);
    }
}
