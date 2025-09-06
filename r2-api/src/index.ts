// Định nghĩa kiểu cho môi trường để TypeScript hiểu các bindings từ wrangler.jsonc
export interface Env {
    DB: D1Database;
    r2: R2Bucket;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // --- BỘ ĐỊNH TUYẾN (ROUTER) ĐƠN GIẢN ---

        // 1. Lấy tất cả người dùng (route cũ)
        if (url.pathname === '/nguoi-dung') {
            try {
                const stmt = env.DB.prepare(
                    "SELECT nguoi_dung_id, ten_dang_nhap, vai_tro, ho_ten, email, trang_thai FROM NguoiDung"
                );
                const { results } = await stmt.all();
                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (e) {
                return new Response("Lỗi: Không thể truy vấn database", { status: 500 });
            }
        }

        // 2. === LOGIC MỚI ĐỂ LẤY MỘT NGƯỜI DÙNG CỤ THỂ ===
        // Kiểm tra xem đường dẫn có bắt đầu bằng '/nguoi-dung/' và có thêm một phần ở sau hay không
        if (url.pathname.startsWith('/nguoi-dung/')) {
            try {
                // Tách đường dẫn để lấy ra tên đăng nhập, ví dụ: 'admin'
                const tenDangNhap = url.pathname.split('/')[2];

                if (!tenDangNhap) {
                    return new Response('Tên đăng nhập không được để trống', { status: 400 });
                }

                // Chuẩn bị câu lệnh SQL an toàn bằng cách sử dụng tham số (?) để tránh lỗi SQL Injection
                const stmt = env.DB.prepare(
                    "SELECT nguoi_dung_id, ten_dang_nhap, vai_tro, ho_ten, email, trang_thai FROM NguoiDung WHERE ten_dang_nhap = ?"
                ).bind(tenDangNhap); // Gắn giá trị 'tenDangNhap' vào dấu ?

                // Dùng .first() để lấy một kết quả duy nhất
                const result = await stmt.first();

                // Nếu tìm thấy người dùng, trả về thông tin
                if (result) {
                    return new Response(JSON.stringify(result), {
                        headers: { 'Content-Type': 'application/json' },
                    });
                } else {
                    // Nếu không tìm thấy, trả về lỗi 404
                    return new Response(JSON.stringify({ error: `Không tìm thấy người dùng với tên đăng nhập: ${tenDangNhap}` }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            } catch (e) {
                return new Response("Lỗi: Không thể truy vấn database", { status: 500 });
            }
        }

        // Nếu không khớp với route nào, trả về danh sách các route có sẵn
        return new Response(JSON.stringify({
            success: false,
            error: "route not found",
            availableRoutes: {
                "GET /nguoi-dung": "Lấy danh sách tất cả người dùng",
                "GET /nguoi-dung/:ten_dang_nhap": "Lấy thông tin một người dùng cụ thể"
            }
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    },
};
