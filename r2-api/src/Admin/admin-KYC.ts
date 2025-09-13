interface Env {
    DB: D1Database;
    kyc: R2Bucket;
}

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 
        'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
     }
});

const bufferToHex = (buffer: ArrayBuffer): string => ([...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join(''));


export const handleGetKycDocuments = async (env: Env, customerId: string) => {
    console.log("\n--- BẮT ĐẦU DEBUG handleGetKycDocuments ---");
    try {
        console.log(`[BACKEND-DEBUG] Worker nhận được customerId dạng chuỗi: "${customerId}"`);
        
        const idAsNumber = parseInt(customerId, 10);
        console.log(`[BACKEND-DEBUG] Đã chuyển đổi ID sang dạng số: ${idAsNumber}`);

        if (isNaN(idAsNumber)) {
            console.error("[BACKEND-DEBUG] Lỗi: ID không phải là số hợp lệ.");
            return jsonResponse({ success: false, error: 'ID khách hàng không hợp lệ' }, 400);
        }
        
        const query = "SELECT * FROM TaiLieuKYC WHERE khach_hang_id = ?";
        console.log(`[BACKEND-DEBUG] Chuẩn bị chạy câu lệnh: ${query} với ID = ${idAsNumber}`);
        
        const { results } = await env.DB.prepare(query).bind(idAsNumber).all();
        
        console.log('[BACKEND-DEBUG] Kết quả D1 trả về:', JSON.stringify(results, null, 2));
        console.log("--- KẾT THÚC DEBUG ---");

        return jsonResponse({ success: true, data: results });

    } catch (e: any) {
        console.error("[BACKEND-DEBUG] Đã có lỗi xảy ra trong khối catch:", e);
        return jsonResponse({ success: false, error: 'Lỗi truy vấn KYC', details: e.message }, 500);
    }
};



export const handleAddKycDocument = async (request: Request, env: Env) => {
    try {
        const formData = await request.formData();
        
        const frontImage = formData.get('front_image') as File | null;
        const backImage = formData.get('back_image') as File | null;
        
        const khach_hang_id = formData.get('khach_hang_id') as string;
        const so_giay_to = formData.get('so_giay_to') as string;
        const noi_cap = formData.get('noi_cap') as string;
        const ngay_cap = formData.get('ngay_cap') as string;
        const ngay_het_han = formData.get('ngay_het_han') as string;

        if (!frontImage || !backImage || !khach_hang_id) {
            return jsonResponse({ success: false, error: 'Thiếu ảnh hoặc ID khách hàng' }, 400);
        }

        const processImage = async (file: File, loai_giay_to: string) => {
            const fileBuffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
            const ma_bam_file = bufferToHex(hashBuffer);

            const uniqueKey = `kyc/${khach_hang_id}/${loai_giay_to}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
            await env.kyc.put(uniqueKey, fileBuffer, { httpMetadata: { contentType: file.type } });
            
            const publicUrl = `https://pub-ac0c00bf5b8346a8a7cc97e58d6a3e85.r2.dev/${uniqueKey}`;

            const query = `
                INSERT INTO TaiLieuKYC (khach_hang_id, loai_giay_to, so_giay_to, duong_dan_file, ma_bam_file, noi_cap, ngay_cap, ngay_het_han, trang_thai, ngay_tao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Verified', datetime('now','+7 hours'))
            `;
            await env.DB.prepare(query).bind(
                khach_hang_id, loai_giay_to, so_giay_to, publicUrl, ma_bam_file, noi_cap, ngay_cap, ngay_het_han
            ).run();
        };

        await Promise.all([
            processImage(frontImage, 'CCCD_TRUOC'),
            processImage(backImage, 'CCCD_SAU')
        ]);
        
        return jsonResponse({ success: true, message: 'Thêm bộ tài liệu CCCD thành công' });

    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Lỗi server khi thêm tài liệu', details: e.message }, 500);
    }
};

export const handleUpdateCccdSet = async (request: Request, env: Env, customerId: string) => {
    try {
        const formData = await request.formData();
        
        // Lấy các trường thông tin. Dùng '??' để cung cấp giá trị mặc định nếu null
        const so_giay_to = formData.get('so_giay_to') as string ?? '';
        const noi_cap = formData.get('noi_cap') as string ?? '';
        const ngay_cap = formData.get('ngay_cap') as string ?? '';
        const ngay_het_han = formData.get('ngay_het_han') as string ?? '';
        const trang_thai = formData.get('trang_thai') as string ?? 'Pending'; // Mặc định là Pending
        const adminId = 1; // Tạm thời hardcode, bạn nên lấy từ session/token sau này

        // Cập nhật các trường text cho CẢ BỘ CCCD
        const updateTextQuery = `
            UPDATE TaiLieuKYC 
            SET 
                so_giay_to = ?, 
                noi_cap = ?, 
                ngay_cap = ?, 
                ngay_het_han = ?, 
                trang_thai = ?, 
                xac_thuc_boi = ?, 
                ngay_xac_thuc = datetime('now','+7 hours')
            WHERE 
                khach_hang_id = ? AND (loai_giay_to = 'CCCD_TRUOC' OR loai_giay_to = 'CCCD_SAU')
        `;
        await env.DB.prepare(updateTextQuery)
            .bind(so_giay_to, noi_cap, ngay_cap, ngay_het_han, trang_thai, adminId, customerId)
            .run();

        // Xử lý cập nhật ảnh (nếu có file mới được tải lên)
        const frontImage = formData.get('front_image') as File | null;
        const backImage = formData.get('back_image') as File | null;

        const processImageUpdate = async (file: File, loai_giay_to: string) => {
            const fileBuffer = await file.arrayBuffer();
            const ma_bam_file = bufferToHex(await crypto.subtle.digest('SHA-256', fileBuffer));
            const uniqueKey = `kyc/${customerId}/${loai_giay_to}_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
            
            await env.kyc.put(uniqueKey, fileBuffer, { httpMetadata: { contentType: file.type } });
            const publicUrl = `https://pub-ac0c00bf5b8346a8a7cc97e58d6a3e85.r2.dev/${uniqueKey}`;

            const updateImageQuery = `UPDATE TaiLieuKYC SET duong_dan_file = ?, ma_bam_file = ? WHERE khach_hang_id = ? AND loai_giay_to = ?`;
            await env.DB.prepare(updateImageQuery).bind(publicUrl, ma_bam_file, customerId, loai_giay_to).run();
        };

        if (frontImage) await processImageUpdate(frontImage, 'CCCD_TRUOC');
        if (backImage) await processImageUpdate(backImage, 'CCCD_SAU');

        return jsonResponse({ success: true, message: 'Cập nhật bộ CCCD thành công' });
        
    } catch (e: any) {
        console.error("[BACKEND-ERROR] Lỗi trong handleUpdateCccdSet:", e);
        return jsonResponse({ success: false, error: 'Lỗi server khi cập nhật CCCD', details: e.message }, 500);
    }
};