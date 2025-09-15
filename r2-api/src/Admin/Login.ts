export interface Env {
  r2: R2Bucket;
  DB: D1Database;
}

export async function getLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ success: false, error: 'Chỉ hỗ trợ POST' }, { status: 405 });
  }

  try {
    const body = await request.json() as {
      username: string;
      password: string;
    };

    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ success: false, error: 'Thiếu username hoặc password' }, { status: 400 });
    }

    const query = `SELECT nguoi_dung_id, ten_dang_nhap, ten_chuc_vu 
                   FROM NguoiDung 
                   WHERE ten_dang_nhap = ? AND mat_khau = ?`;

    const user = await env.DB.prepare(query)
      .bind(username, password)
      .first();

    if (!user) {
      return Response.json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu ❌' }, { status: 401 });
    }
    
    return Response.json({
      success: true,
      message: 'Đăng nhập thành công ✅',
      data: {
        id: user.nguoi_dung_id,
        username: user.ten_dang_nhap,
        chucVu: user.vai_tro,
      }
    });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Lỗi server: ' + (err?.message ?? String(err)) }, { status: 500 });
  }
}
