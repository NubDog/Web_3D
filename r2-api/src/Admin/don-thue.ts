import { generateContractPDF } from "./file-pdf";

const jsonResponse = (data: any, status = 200) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return new Response(JSON.stringify(data), { status, headers });
};

interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
    hd: R2Bucket
}

interface RentalRequestBody {
    khach_hang_id: number;
    phuong_tien_id: number;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    dia_diem_nhan: string;
    dia_diem_tra: string;
}

export const handleCreateRentalOrder = async (request: Request, env: Env) => {
    try {
        const body: RentalRequestBody = await request.json();

        const { khach_hang_id, phuong_tien_id, ngay_bat_dau, ngay_ket_thuc, dia_diem_nhan, dia_diem_tra } = body;
        if (!khach_hang_id || !phuong_tien_id || !ngay_bat_dau || !ngay_ket_thuc) {
            return jsonResponse({ success: false, error: "Thiếu thông tin bắt buộc." }, 400);
        }

        const startDate = new Date(ngay_bat_dau);
        const endDate = new Date(ngay_ket_thuc);

        if (startDate >= endDate) {
            return jsonResponse({ success: false, error: "Ngày kết thúc phải sau ngày bắt đầu." }, 400);
        }


        const customerStmt = env.DB.prepare(
            `SELECT nguoi_dung_id FROM KhachHang WHERE khach_hang_id = ?`
        );
        const customerInfo = await customerStmt.bind(khach_hang_id).first<{ nguoi_dung_id: number }>();

        if (!customerInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy thông tin khách hàng." }, 404);
        }
        const nguoi_dung_id = customerInfo.nguoi_dung_id;


        const CheckBlock = env.DB.prepare(
            `SELECT trang_thai from NguoiDung where nguoi_dung_id = ?`
        )
        const getStatus = await CheckBlock.bind(nguoi_dung_id).first<{ trang_thai: string }>()

        if (getStatus?.trang_thai === 'inactive') {
            return jsonResponse({ success: false, error: "Người dùng đã bị khóa." }, 410);
        }

        const vehicleStmt = env.DB.prepare(
            `SELECT pt.trang_thai, pt.chinh_sach_id, pt.gia_thue, cs.tien_coc_mac_dinh 
             FROM PhuongTien AS pt
             JOIN ChinhSachGia AS cs ON pt.chinh_sach_id = cs.chinh_sach_id
             WHERE pt.phuong_tien_id = ?`
        );
        const vehicleInfo = await vehicleStmt.bind(phuong_tien_id).first<{ trang_thai: string, chinh_sach_id: number, gia_thue: number, tien_coc_mac_dinh: number }>();

        if (!vehicleInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy phương tiện." }, 404);
        }
        if (vehicleInfo.trang_thai !== 'Hoạt động' && vehicleInfo.trang_thai !== 'SAN_SANG') {
            return jsonResponse({ success: false, error: "Phương tiện không sẵn sàng để cho thuê." }, 409);
        }

        const conflictStmt = env.DB.prepare(
            `SELECT don_thue_id FROM DonThue
            WHERE phuong_tien_id = ? 
            AND trang_thai IN ('DA_DUYET', 'DANG_THUE')
            AND (
                (ngay_bat_dau < ? AND ngay_ket_thuc > ?)
            )`
        );
        const conflictingOrder = await conflictStmt.bind(phuong_tien_id, ngay_ket_thuc, ngay_bat_dau).first();

        if (conflictingOrder) {
            return jsonResponse({ success: false, error: "Phương tiện đã được đặt trong khoảng thời gian này." }, 409);
        }

        const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const tong_tien = rentalDays * vehicleInfo.gia_thue;
        const tien_coc_yeu_cau = vehicleInfo.tien_coc_mac_dinh;

        const insertOrderStmt = env.DB.prepare(
            `INSERT INTO DonThue (khach_hang_id, phuong_tien_id, ngay_bat_dau, ngay_ket_thuc, dia_diem_nhan, dia_diem_tra, trang_thai, chinh_sach_id, tong_tien, tien_coc_yeu_cau, ngay_tao, ngay_cap_nhat)
             VALUES (?, ?, ?, ?, ?, ?, 'CHO_DUYET', ?, ?, ?, datetime('now', '+7 hours'), datetime('now', '+7 hours'))`
        );
        const updateVehicleStmt = env.DB.prepare(
            `UPDATE PhuongTien SET trang_thai = 'DA_DAT' WHERE phuong_tien_id = ?`
        );

        const result = await env.DB.batch([
            insertOrderStmt.bind(khach_hang_id, phuong_tien_id, ngay_bat_dau, ngay_ket_thuc, dia_diem_nhan, dia_diem_tra, vehicleInfo.chinh_sach_id, tong_tien, tien_coc_yeu_cau),
            updateVehicleStmt.bind(phuong_tien_id)
        ]);

        return jsonResponse({
            success: true,
            message: `Yêu cầu thuê xe đã được gửi thành công!`,
            data: {
                trang_thai: "CHO_DUYET",
                tong_tien_du_kien: tong_tien,
                tien_coc_yeu_cau: tien_coc_yeu_cau
            }
        });

    } catch (e: any) {
        console.error("API handleCreateRentalOrder lỗi:", e);
        return jsonResponse({ success: false, error: e.message || "Internal Server Error" }, 500);
    }
};

//DS chờ duyệt
export const handleGetPendingOrders = async (request: Request, env: Env) => {
    try {
        const stmt = env.DB.prepare(
            `SELECT 
                dt.don_thue_id, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc, 
                dt.tong_tien, kh.ho_ten, pt.ten_phuong_tien
             FROM DonThue AS dt
             JOIN KhachHang AS kh ON dt.khach_hang_id = kh.khach_hang_id
             JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
             WHERE dt.trang_thai = 'CHO_DUYET'
             ORDER BY dt.ngay_tao DESC`
        );
        const { results } = await stmt.all();
        return jsonResponse({ success: true, data: results });

    } catch (e: any) {
        console.error("API handleGetPendingOrders lỗi:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//Duyệt đơn
// export const handleApproveOrder = async (request: Request, env: Env, orderId: string) => {
//     try {
//         const { nhan_vien_id } = await request.json<{ nhan_vien_id: number }>();
//         if (!nhan_vien_id) {
//             return jsonResponse({ success: false, error: "Thiếu ID nhân viên." }, 400);
//         }

//         const orderInfo = await env.DB.prepare("SELECT * FROM DonThue WHERE don_thue_id = ? AND trang_thai = 'CHO_DUYET'").bind(orderId).first<{ don_thue_id: number, khach_hang_id:number, tong_tien: number, tien_coc_yeu_cau: number }>();

//         if (!orderInfo) {
//             return jsonResponse({ success: false, error: "Đơn thuê không hợp lệ hoặc đã được xử lý." }, 404);
//         }

//         const today = new Date();
//         const year = today.getFullYear();
//         const month = String(today.getMonth() + 1).padStart(2, '0');
//         const day = String(today.getDate()).padStart(2, '0');
//         const so_hop_dong = `HD-${year}${month}${day}-${orderId}`;

//         const approveOrderStmt = env.DB.prepare(
//             "UPDATE DonThue SET trang_thai = 'DA_DUYET', nhan_vien_tao = ? WHERE don_thue_id = ?"
//         );
//         const createContractStmt = env.DB.prepare(
//             "INSERT INTO HopDong (don_thue_id, so_hop_dong, ngay_ky, nhan_vien_ky, khach_hang_ky, trang_thai) VALUES (?, ?, datetime('now','+7 hours'), ?,?, 'CHO_KY')"
//         );
//         const createDepositStmt = env.DB.prepare(
//             "INSERT INTO TienCoc (don_thue_id, so_tien, trang_thai) VALUES (?, ?, 'CHO_THANH_TOAN')"
//         );
//         const createPaymentStmt = env.DB.prepare(
//             "INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, trang_thai) VALUES (?, ?, 'PHI_THUE', 'CHO_THANH_TOAN')"
//         );

//         await env.DB.batch([
//             approveOrderStmt.bind(nhan_vien_id, orderId),
//             createContractStmt.bind(orderId, so_hop_dong, nhan_vien_id, orderInfo.khach_hang_id ), 
//             createDepositStmt.bind(orderId, orderInfo.tien_coc_yeu_cau),
//             createPaymentStmt.bind(orderId, orderInfo.tong_tien),
//         ]);

//         return jsonResponse({ success: true, message: `Đã duyệt đơn thuê #${orderId}` });

//     } catch (e: any) {
//         console.error("API handleApproveOrder Lỗi:", e);
//         return jsonResponse({ success: false, error: e.message }, 500);
//     }
// };

export const handleApproveOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id } = await request.json<{ nhan_vien_id: number }>();
        if (!nhan_vien_id) return jsonResponse({ success: false, error: "Thiếu ID nhân viên" }, 400);

        const orderInfo = await env.DB.prepare(`
            SELECT 
                dt.don_thue_id, dt.tong_tien, dt.tien_coc_yeu_cau, 
                dt.ngay_bat_dau, dt.ngay_ket_thuc,

                cs.ty_le_giam,
                
                kh.khach_hang_id, kh.ho_ten, kh.dia_chi,
                
                nd.so_dien_thoai, nd.email,

                pt.ten_phuong_tien, pt.bien_so, pt.so_km, pt.gia_thue,

                -- Lấy CCCD và Ảnh từ bảng TaiLieuKYC
                kyc.so_giay_to,
                kyc_truoc.duong_dan_file as anh_truoc,
                kyc_sau.duong_dan_file as anh_sau
                
            FROM DonThue dt
            JOIN KhachHang kh ON dt.khach_hang_id = kh.khach_hang_id
            JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
            JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
            JOIN ChinhSachGia cs ON dt.chinh_sach_id = cs.chinh_sach_id
            
            -- Join lấy số CCCD
            LEFT JOIN TaiLieuKYC kyc ON kh.khach_hang_id = kyc.khach_hang_id 
            
            -- Join lấy ảnh mặt trước (Giả sử loai_giay_to = 'CCCD_TRUOC')
            LEFT JOIN TaiLieuKYC kyc_truoc ON kh.khach_hang_id = kyc_truoc.khach_hang_id AND kyc_truoc.loai_giay_to = 'CCCD_TRUOC'
            
            -- Join lấy ảnh mặt sau
            LEFT JOIN TaiLieuKYC kyc_sau ON kh.khach_hang_id = kyc_sau.khach_hang_id AND kyc_sau.loai_giay_to = 'CCCD_SAU'

            WHERE dt.don_thue_id = ? 
            GROUP BY dt.don_thue_id
        `).bind(Number(orderId)).first<any>();

        if (!orderInfo) return jsonResponse({ success: false, error: "Không tìm thấy đơn" }, 404);

        const d1 = new Date(orderInfo.ngay_bat_dau);
        const d2 = new Date(orderInfo.ngay_ket_thuc);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const soNgay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const donGia = Number(orderInfo.gia_thue || 0);
        const tyLeGiam = Number(orderInfo.ty_le_giam || 0);

        const tamTinh = donGia * soNgay;
        const tienGiam = Math.round(tamTinh * (tyLeGiam / 100));
        const tongTien = tamTinh - tienGiam;
        const tienCoc = tongTien * (orderInfo.tien_coc_yeu_cau/100) ;

        const fmt = (t: number) => t.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

        const so_hop_dong = `HD-${orderId}-${new Date().getTime()}`;
        const contractData = {
            so_hop_dong: so_hop_dong,
            don_thue_id: orderInfo.don_thue_id,
            ngay_tao: new Date().toLocaleDateString('vi-VN'),

            khach_hang_ten: orderInfo.ho_ten,
            cccd_so: orderInfo.so_giay_to,
            sdt: orderInfo.so_dien_thoai,
            dia_chi: orderInfo.dia_chi,

            ten_phuong_tien: orderInfo.ten_phuong_tien,
            bien_so: orderInfo.bien_so,
            km_luc_giao: orderInfo.so_km,

            ngay_bat_dau: orderInfo.ngay_bat_dau,
            ngay_ket_thuc: orderInfo.ngay_ket_thuc,
            don_gia: donGia,
            
            giathue: donGia,                          
            ty_le_giam: tyLeGiam,                     
            tylegiam: tyLeGiam,                       
            giam_gia: tienGiam,                       
            ten_chinh_sach: orderInfo.ten_chinh_sach || '', 

            
            tong_tien: tongTien,
            tien_coc_yeu_cau: tienCoc,
            

            cccd_anh_truoc: orderInfo.anh_truoc,
            cccd_anh_sau: orderInfo.anh_sau
        };

        const pdfBytes = await generateContractPDF(contractData);
        const key = `contracts/${so_hop_dong}.pdf`;

        await env.hd.put(key, pdfBytes, {
            httpMetadata: { contentType: 'application/pdf' }
        });

        const publicUrl = `https://pub-16b3320136404cf291d44538099e8338.r2.dev/${key}`;

        await env.DB.batch([
            // Cập nhật trạng thái đơn
            env.DB.prepare("UPDATE DonThue SET trang_thai = 'DA_DUYET', nhan_vien_tao = ?, ngay_cap_nhat = datetime('now', '+7 hours') WHERE don_thue_id = ?")
                .bind(nhan_vien_id, orderId),

            // Tạo hợp đồng 
            env.DB.prepare(`
                INSERT INTO HopDong (don_thue_id, so_hop_dong, khach_hang_ky, ngay_ky, nhan_vien_ky, trang_thai, duong_dan_file) 
                VALUES (?, ?,?, datetime('now','+7 hours'), ?, 'CHO_KY', ?)
            `).bind(orderId, so_hop_dong, orderInfo.khach_hang_id, nhan_vien_id, publicUrl),
            // Tạo phiếu thu tiền cọc
            env.DB.prepare(`
                INSERT INTO TienCoc (don_thue_id, so_tien, phuong_thuc, trang_thai, ngay_giu, ngay_tao, ngay_cap_nhat) 
                VALUES (?, ?, 'TIEN_MAT', 'CHO_THANH_TOAN', datetime('now', '+7 hours'), datetime('now', '+7 hours'), datetime('now', '+7 hours'))
            `).bind(orderId, orderInfo.tien_coc_yeu_cau)
        ]);

        if (env.RESEND_API_KEY) {
            console.log("🔥 Đang gửi mail...");

            const emailBody = {
                from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                to: 'khoatran3123@gmail.com',
                subject: `[ĐÃ DUYỆT] Hợp đồng thuê xe #${orderId}`,
                html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; border: 1px solid #cccccc; background-color: #ffffff;">
                        <tr><td align="center" bgcolor="#008cffff" style="padding: 20px 0;"><h1 style="color: #ffffff; margin: 0; font-size: 24px;">XÁC NHẬN HỢP ĐỒNG</h1></td></tr>
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #333333; margin-top: 0;">Xin chào ${orderInfo.ho_ten},</h2>
                                <p style="color: #555555; font-size: 16px; line-height: 1.5;">Đơn thuê xe <strong>#${orderId}</strong> của bạn đã được duyệt. Chi tiết tài chính như sau:</p>
                                
                                <table width="100%" style="border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; font-size: 15px;">
                                    <tr style="border-bottom: 1px solid #eeeeee;">
                                        <td style="padding: 12px 0; color: #555555;">Phương tiện:</td>
                                        <td style="padding: 12px 0; color: #333333; text-align: right; font-weight: bold;">${orderInfo.ten_phuong_tien}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #eeeeee;">
                                        <td style="padding: 12px 0; color: #555555;">Thời gian:</td>
                                        <td style="padding: 12px 0; color: #333333; text-align: right;">${new Date(orderInfo.ngay_bat_dau).toLocaleDateString('vi-VN')} - ${new Date(orderInfo.ngay_ket_thuc).toLocaleDateString('vi-VN')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #eeeeee;">
                                        <td style="padding: 12px 0; color: #555555;">Tạm tính:</td>
                                        <td style="padding: 12px 0; color: #333333; text-align: right;">${fmt(tamTinh)}</td>
                                    </tr>
                                    
                                    ${tienGiam > 0 ? `
                                    <tr style="border-bottom: 1px solid #eeeeee;">
                                        <td style="padding: 12px 0; color: #555555;">Khuyến mãi (${tyLeGiam}%):<br><span style="font-size:12px;color:#888">${orderInfo.ten_chinh_sach || ''}</span></td>
                                        <td style="padding: 12px 0; color: #28a745; text-align: right; font-weight: bold;">-${fmt(tienGiam)}</td>
                                    </tr>` : ''}

                                    <tr style="border-bottom: 1px solid #eeeeee;">
                                        <td style="padding: 12px 0; color: #333333; font-weight: bold; font-size: 16px;">Tổng tiền thuê:</td>
                                        <td style="padding: 12px 0; color: #008cffff; text-align: right; font-weight: bold; font-size: 18px;">${fmt(tongTien)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; color: #555555;">Tiền cọc yêu cầu:</td>
                                        <td style="padding: 12px 0; color: #666; text-align: right;">${fmt(tienCoc)}</td>
                                    </tr>
                                </table>
                                
                                <p style="text-align: center; margin-top: 30px;">
                                    <a href="${publicUrl}" style="background-color: #008cffff; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">XEM CHI TIẾT HỢP ĐỒNG</a>
                                </p>
                            </td>
                        </tr>
                        <tr><td bgcolor="#f4f4f4" style="padding: 20px 30px; text-align: center; border-top: 1px solid #cccccc;"><p style="margin: 0; color: #888888; font-size: 12px;">&copy; ${new Date().getFullYear()} Dịch vụ cho thuê xe.</p></td></tr>
                    </table>
                </body>
                </html>`
            };

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(emailBody)
            });

            if (res.ok) console.log("✅ Đã gửi mail thành công!");
            else console.log("❌ Lỗi Resend:", await res.text());

        } else {
            console.log("⚠️ Không tìm thấy RESEND_API_KEY");
        }

        return jsonResponse({ success: true, contractUrl: publicUrl });

    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//Từ chối đơn (nhân viên / admin hủy trực tiếp)
export const handleRejectOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id, ly_do } = await request.json<{ nhan_vien_id: number, ly_do?: string }>();
        if (!nhan_vien_id) {
            return jsonResponse({ success: false, error: "Thiếu ID nhân viên." }, 400);
        }

        const orderInfo = await env.DB.prepare(
            "SELECT phuong_tien_id FROM DonThue WHERE don_thue_id = ? AND trang_thai = 'CHO_DUYET'"
        ).bind(orderId).first<{ phuong_tien_id: number }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Đơn thuê không hợp lệ hoặc đã được xử lý." }, 404);
        }

        const rejectOrderStmt = env.DB.prepare(
            "UPDATE DonThue SET trang_thai = 'TU_CHOI', ghi_chu = ? WHERE don_thue_id = ?"
        );
        const releaseVehicleStmt = env.DB.prepare(
            "UPDATE PhuongTien SET trang_thai = 'SAN_SANG' WHERE phuong_tien_id = ?"
        );

        await env.DB.batch([
            rejectOrderStmt.bind(ly_do || 'Không có lý do', orderId),
            releaseVehicleStmt.bind(orderInfo.phuong_tien_id),
        ]);

        return jsonResponse({ success: true, message: `Đã từ chối đơn thuê #${orderId}` });

    } catch (e: any) {
        console.error("API handleRejectOrder lỗi :", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

// hủy đơn (sau khi duyệt đơn) - nv sẽ hủy đơn thay cho khách hàng
export const handleCancelOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const { nhan_vien_id, ly_do_huy } = await request.json<{ nhan_vien_id: number, ly_do_huy: string }>();

        if (!nhan_vien_id || !ly_do_huy) {
            return jsonResponse({ success: false, error: "Thiếu ID nhân viên hoặc lý do hủy." }, 400);
        }

        const orderStmt = env.DB.prepare(
            `SELECT trang_thai, phuong_tien_id FROM DonThue WHERE don_thue_id = ?`
        );
        const orderInfo = await orderStmt.bind(orderId).first<{ trang_thai: string, phuong_tien_id: number }>();

        if (!orderInfo) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn thuê." }, 404);
        }

        if (orderInfo.trang_thai !== 'DA_DUYET') {
            return jsonResponse({ success: false, error: `Không thể hủy đơn hàng ở trạng thái "${orderInfo.trang_thai}".` }, 409);
        }

        const cancelOrderStmt = env.DB.prepare(
            `UPDATE DonThue SET trang_thai = 'TU_CHOI', ghi_chu = ? WHERE don_thue_id = ?`
        );

        const releaseVehicleStmt = env.DB.prepare(
            `UPDATE PhuongTien SET trang_thai = 'SAN_SANG' WHERE phuong_tien_id = ?`
        );

        await env.DB.batch([
            cancelOrderStmt.bind(`Đơn đã bị hủy bởi nhân viên. Lý do: ${ly_do_huy}`, orderId),
            releaseVehicleStmt.bind(orderInfo.phuong_tien_id)
        ]);

        return jsonResponse({ success: true, message: "Hủy đơn hàng thành công." });
    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//hàm gọi chi tiết đơn thuê
export const handleGetOrderDetails = async (request: Request, env: Env, orderId: string) => {
    try {
        const stmt = env.DB.prepare(
            `SELECT 
                dt.*, 
                kh.ho_ten, kh.email, 
                pt.ten_phuong_tien, pt.bien_so, pt.gia_thue,
                cs.ten_chinh_sach, cs.ty_le_giam, cs.tien_coc_mac_dinh,
                tc.trang_thai AS trang_thai_coc,
                tc.tien_coc_id,
                tc.ngay_giu as ngay_duyet_coc,

                pt.so_km AS so_km_xe,
                hd.duong_dan_file,

                bbgn_giao.so_km AS giao_so_km,
                bbgn_giao.muc_xang AS giao_muc_xang,
                bbgn_giao.ghi_chu_hu_hong AS giao_ghi_chu,
                bbgn_giao.duong_dan_anh AS giao_anh,

                bbgn_tra.so_km AS tra_so_km,
                bbgn_tra.muc_xang AS tra_muc_xang,
                bbgn_tra.ghi_chu_hu_hong AS tra_ghi_chu,
                bbgn_tra.duong_dan_anh AS tra_anh,
                
                COALESCE(
                    (SELECT SUM(so_tien) 
                     FROM ThanhToan 
                     WHERE don_thue_id = dt.don_thue_id 
                     AND muc_dich = 'PHU_PHI'
                     AND trang_thai IN ('CHO_THANH_TOAN', 'DA_THANH_TOAN')), 
                    0
                ) as tong_phi_phat

              FROM DonThue AS dt
            JOIN NguoiDung AS kh ON dt.khach_hang_id = kh.nguoi_dung_id
            JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
            JOIN ChinhSachGia AS cs ON dt.chinh_sach_id = cs.chinh_sach_id
            LEFT JOIN TienCoc AS tc ON dt.don_thue_id = tc.don_thue_id
            
            -- JOIN lấy thông tin bàn giao
            LEFT JOIN BienBanGiaoNhan AS bbgn_giao ON dt.don_thue_id = bbgn_giao.don_thue_id AND bbgn_giao.loai_bien_ban = 'GIAO_XE'
            
            -- JOIN lấy thông tin trả xe
            LEFT JOIN BienBanGiaoNhan AS bbgn_tra ON dt.don_thue_id = bbgn_tra.don_thue_id AND bbgn_tra.loai_bien_ban = 'TRA_XE'

            LEFT JOIN HopDong hd ON dt.don_thue_id = hd.don_thue_id

            WHERE dt.don_thue_id = ?`
        );
        const orderDetails = await stmt.bind(orderId).first();


        if (!orderDetails) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn thuê." }, 404);
        }

        return jsonResponse({ success: true, data: orderDetails });

    } catch (e: any) {
        console.error("API Error in handleGetOrderDetails:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

export const handleGetOrders = async (request: Request, env: Env) => {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        const baseQuery = `
            SELECT 
                dt.don_thue_id, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc, 
                dt.tong_tien, dt.trang_thai, kh.ho_ten, pt.ten_phuong_tien
            FROM DonThue AS dt
            JOIN NguoiDung AS kh ON dt.khach_hang_id = kh.nguoi_dung_id
            JOIN PhuongTien AS pt ON dt.phuong_tien_id = pt.phuong_tien_id
        `;

        let finalQuery = baseQuery;
        const params = [];

        if (status) {
            const statusMap: { [key: string]: string } = {
                pending: 'CHO_DUYET',
                approved: 'DA_DUYET',
                active: 'DANG_THUE',
                returned: 'DA_TRA',
                completed: 'HOAN_TAT',
                cancelled: 'TU_CHOI'
            };
            const dbStatus = statusMap[status];

            if (!dbStatus) {
                return jsonResponse({ success: false, error: "Trạng thái không hợp lệ." }, 400);
            }
            finalQuery += ` WHERE dt.trang_thai = ?`;
            params.push(dbStatus);
        }

        finalQuery += ` ORDER BY dt.ngay_tao DESC`;

        const stmt = env.DB.prepare(finalQuery).bind(...params);
        const { results } = await stmt.all();

        return jsonResponse({ success: true, data: results });

    } catch (e: any) {
        console.error("API Error in handleGetOrders:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};

//hàm gửi email

const sendEmail = async (apiKey: string, toEmail: string, userName: string, contractUrl: string, orderId: string) => {
    if (!apiKey || !toEmail) return;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'ThueXe <onboarding@resend.dev>',
                tto: ['khoatran3123@gmail.com'],  //[toEmail], 
                subject: `[ĐÃ DUYỆT] Hợp đồng thuê xe #${orderId}`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.5;">
                        <h2>Xin chào ${userName},</h2>
                        <p>Yêu cầu thuê xe của bạn (Mã đơn: <strong>#${orderId}</strong>) đã được duyệt.</p>
                        <p>Chúng tôi đã tạo hợp đồng điện tử. Vui lòng bấm vào nút dưới để xem và tải về:</p>
                        <br/>
                        <a href="${contractUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            📄 Xem Hợp Đồng PDF
                        </a>
                        <br/><br/>
                        <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
                    </div>
                `
            })
        });

        if (!res.ok) {
            console.error("Lỗi gửi mail:", await res.text());
        } else {
            console.log(`Đã gửi mail thành công tới: ${toEmail}`);
        }
    } catch (e) {
        console.error("Lỗi kết nối Resend:", e);
    }
};
// HÀM QUYẾT TOÁN (Chỉ tính tiền, chưa hoàn tất)
export const handleSettleOrder = async (request: Request, env: Env, orderId: string) => {
    try {
        const body = await request.json<{
            tong_tien_phat_sinh: number;
            ghi_chu_quyet_toan: string;
            tong_tien_cuoi_cung: number;
        }>();

        const { tong_tien_phat_sinh, ghi_chu_quyet_toan, tong_tien_cuoi_cung } = body;

        const ghiChuMoi = `[WAITING_PAYMENT] | ${ghi_chu_quyet_toan}`;


        const updateStmt = env.DB.prepare(`
            UPDATE DonThue 
            SET tong_tien = ?, 
                ghi_chu = ?, 
                ngay_cap_nhat = datetime('now', '+7 hours')
            WHERE don_thue_id = ?
        `);

        const insertPaymentLog = env.DB.prepare(`
             INSERT INTO ThanhToan (don_thue_id, so_tien, muc_dich, phuong_thuc, trang_thai, ngay_tt, ngay_tao)
             VALUES (?, ?, 'PHU_PHI', 'TIEN_MAT', 'CHO_THANH_TOAN', datetime('now', '+7 hours'), datetime('now', '+7 hours'))
        `);

        const batch = [
            updateStmt.bind(tong_tien_cuoi_cung, ghiChuMoi, orderId)
        ];

        if (tong_tien_phat_sinh !== 0) {
            batch.push(insertPaymentLog.bind(orderId, tong_tien_phat_sinh));
        }

        await env.DB.batch(batch);

        return jsonResponse({ success: true, message: "Đã cập nhật tổng tiền và phí phát sinh." });

    } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};
// XÁC NHẬN ĐÃ THU TIỀN (Hoàn tất đơn)
export const handleConfirmPayment = async (request: Request, env: Env, orderId: string) => {
    try {
        console.log("🔑 RESEND_API_KEY exists:", !!env.RESEND_API_KEY);
        console.log("📧 Order ID:", orderId);
        
        const { nhan_vien_id } = await request.json<{ nhan_vien_id: number }>();

        const orderData = await env.DB.prepare(`
            SELECT 
                dt.don_thue_id,
                dt.ngay_bat_dau,
                dt.ngay_ket_thuc,
                dt.tong_tien,
                dt.tien_coc_yeu_cau,
                
                kh.ho_ten,
                nd.email,
                nd.so_dien_thoai,
                
                pt.ten_phuong_tien,
                pt.bien_so,
                pt.gia_thue,
                
                cs.ty_le_giam,
                
                hd.duong_dan_file as hop_dong_url
                
            FROM DonThue dt
            JOIN KhachHang kh ON dt.khach_hang_id = kh.khach_hang_id
            JOIN NguoiDung nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
            JOIN PhuongTien pt ON dt.phuong_tien_id = pt.phuong_tien_id
            JOIN ChinhSachGia cs ON dt.chinh_sach_id = cs.chinh_sach_id
            LEFT JOIN HopDong hd ON dt.don_thue_id = hd.don_thue_id
            
            WHERE dt.don_thue_id = ?
        `).bind(orderId).first<{
            don_thue_id: number;
            ngay_bat_dau: string;
            ngay_ket_thuc: string;
            tong_tien: number;
            tien_coc_yeu_cau: number;
            ho_ten: string;
            email: string;
            so_dien_thoai: string;
            ten_phuong_tien: string;
            bien_so: string;
            ty_le_giam: number;
            hop_dong_url: string;
            gia_thue: number
        }>();

        if (!orderData) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn hàng" }, 404);
        }

        console.log("📦 Order Data:", {
            email: orderData.email,
            ho_ten: orderData.ho_ten,
            don_thue_id: orderData.don_thue_id
        });

        await env.DB.prepare(`
            UPDATE DonThue 
            SET trang_thai = 'HOAN_TAT', 
                ngay_cap_nhat = datetime('now', '+7 hours')
            WHERE don_thue_id = ?
        `).bind(orderId).run();

        await env.DB.prepare(`
            UPDATE ThanhToan SET trang_thai = 'DA_THANH_TOAN' WHERE don_thue_id = ?
        `).bind(orderId).run();

        if (env.RESEND_API_KEY && orderData.email) {
            console.log("📧 BẮT ĐẦU GỬI EMAIL...");

            const fmt = (t: number) => t.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            
            const d1 = new Date(orderData.ngay_bat_dau);
            const d2 = new Date(orderData.ngay_ket_thuc);
            const soNgay = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1;

            const tamTinh = soNgay * orderData.gia_thue
            const tienGiam = Math.round(tamTinh * (orderData.ty_le_giam / 100));
            const tongTien = tamTinh - tienGiam;
            const tiencocthucte = tongTien * (orderData.tien_coc_yeu_cau/100)
            const emailBody = {
                from: 'Dịch Vụ Thuê Xe <onboarding@resend.dev>',
                to: ['khoatran3123@gmail.com'], 
                subject: `🎉 Hoàn tất đơn thuê xe #${orderId} - Cảm ơn bạn!`,
                html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; border: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                        
                        <tr>
                            <td align="center" bgcolor="#10b981" style="padding: 30px 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 ĐƠN HÀNG HOÀN TẤT</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #333333; margin-top: 0;">Xin chào ${orderData.ho_ten},</h2>
                                
                                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                                    Cảm ơn bạn đã sử dụng dịch vụ thuê xe của chúng tôi! 
                                    Đơn hàng <strong>#${orderId}</strong> của bạn đã được hoàn tất.
                                </p>

                                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                                    <p style="margin: 0; color: #166534; font-weight: bold;">✅ Thanh toán đã được xác nhận</p>
                                    <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">Chúng tôi đã nhận đủ số tiền thanh toán từ bạn.</p>
                                </div>

                                <h3 style="color: #333333; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">📋 Thông tin chuyến thuê</h3>
                                
                                <table width="100%" style="border-collapse: collapse; margin-top: 15px; font-size: 15px;">
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 12px 0; color: #666666;">Phương tiện:</td>
                                        <td style="padding: 12px 0; color: #333333; text-align: right; font-weight: bold;">
                                            ${orderData.ten_phuong_tien}<br>
                                            <span style="font-size: 13px; color: #888888;">${orderData.bien_so}</span>
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 12px 0; color: #666666;">Thời gian thuê:</td>
                                        <td style="padding: 12px 0; color: #333333; text-align: right;">
                                            ${d1.toLocaleDateString('vi-VN')} - ${d2.toLocaleDateString('vi-VN')}<br>
                                            <span style="font-size: 13px; color: #888888;">(${soNgay} ngày)</span>
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 12px 0; color: #666666;">Tiền cọc đã trả:</td>
                                        <td style="padding: 12px 0; color: #333333; text-align: right;">${ fmt(tiencocthucte) }</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; color: #333333; font-weight: bold; font-size: 16px;">Tổng thanh toán (đã tính cọc): </td>
                                        <td style="padding: 12px 0; color: #10b981; text-align: right; font-weight: bold; font-size: 18px;">${fmt(orderData.tong_tien - tiencocthucte)}</td>
                                    </tr>
                                </table>

                                ${orderData.hop_dong_url ? `
                                <p style="text-align: center; margin-top: 35px;">
                                    <a href="${orderData.hop_dong_url}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                                        📄 Xem Hợp Đồng
                                    </a>
                                </p>
                                ` : ''}

                                <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
                                    <h3 style="color: #92400e; margin: 0 0 10px 0;">⭐ Đánh giá trải nghiệm của bạn</h3>
                                    <p style="color: #78350f; margin: 0 0 15px 0; font-size: 14px;">
                                        Ý kiến của bạn rất quan trọng với chúng tôi!
                                    </p>
                                    <a href="/" style="background-color: #fbbf24; color: #78350f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                        Viết đánh giá
                                    </a>
                                </div>

                                <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-top: 30px;">
                                    Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. 
                                    Rất mong được phục vụ bạn trong những chuyến đi tiếp theo! 🚗
                                </p>

                                <p style="color: #888888; font-size: 13px; margin-top: 20px;">
                                    Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:<br>
                                    📞 Hotline: <strong>1900-xxxx</strong><br>
                                    📧 Email: <strong>support@thuexe.vn</strong>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td bgcolor="#f9fafb" style="padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                    &copy; ${new Date().getFullYear()} Dịch vụ cho thuê đa phương tiện. All rights reserved.
                                </p>
                                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
                                    Email này được gửi tự động, vui lòng không trả lời.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                `
            };

            console.log("📤 Sending to Resend API...");
            console.log("📧 Email body:", JSON.stringify(emailBody).substring(0, 200));

            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailBody)
            });

            console.log("📬 Response status:", emailRes.status);
            const responseText = await emailRes.text();
            console.log("📬 Response body:", responseText);

            if (emailRes.ok) {
                console.log("✅ Đã gửi email hoàn thành thành công!");
            } else {
                console.error("❌ Lỗi gửi email:", responseText);
            }
        } else {
            console.log("⚠️ KHÔNG GỬI EMAIL - Điều kiện không thỏa:");
            console.log("  - RESEND_API_KEY:", env.RESEND_API_KEY ? "OK" : "MISSING");
            console.log("  - orderData.email:", orderData.email || "MISSING");
        }

        return jsonResponse({ 
            success: true, 
            message: "Đã xác nhận thanh toán. Đơn hàng HOÀN TẤT." 
        });

    } catch (e: any) {
        console.error("❌ Error:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};
