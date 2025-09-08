interface Env {
	r2: R2Bucket;
	DB: D1Database;
}
export async function getDanhmucphuongtiens(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;
	if (request.method === 'GET') {
		try {
			const result = await env.DB.prepare('SELECT * FROM DanhMucPhuongTien;').all();

			return Response.json({ success: true, data: result.results });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return Response.json({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
		}
	}
	return Response.json({ success: false, error: 'Method not allowed' });
}
export async function getDanhmucphuongtienid(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method === 'GET') {
		try {
			const result = await env.DB.prepare('SELECT * FROM DanhMucPhuongTien WHERE danh_muc_id=?;').bind(id).all();
			if (result.results.length === 0) {
				return Response.json({ success: false, error: 'Không tìm thấy danh mục với ID đã cho' }, { status: 404 });
			}
			return Response.json({ success: true, data: result.results[0] });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return Response.json({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
		}
	}
	return Response.json({ success: false, error: 'Method not allowed' });
}
export async function Adddanhmucphuongtien(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}

	try {
		const body = (await request.json()) as {
			ten_danh_muc: string;
			mo_ta: string;
		};

		if (!body.ten_danh_muc || !body.mo_ta) {
			return Response.json({ success: false, error: 'Missing ten_danh_muc or mo_ta' }, { status: 400 });
		}

		const existingResult = await env.DB.prepare('SELECT COUNT(*) as count FROM DanhMucPhuongTien WHERE ten_danh_muc = ?;')
			.bind(body.ten_danh_muc)
			.all();

		const count = Number(existingResult.results[0].count);

		if (count > 0) {
			return Response.json(
				{
					success: false,
					error: `Tên danh mục '${body.ten_danh_muc}' đã tồn tại.`,
				},
				{ status: 409 }
			);
		}

		const insertResult = await env.DB.prepare('INSERT INTO DanhMucPhuongTien (ten_danh_muc, mo_ta) VALUES (?, ?);')
			.bind(body.ten_danh_muc, body.mo_ta)
			.run();

		return Response.json({
			success: true,
			message: 'Thêm danh mục phương tiện thành công',
			danh_muc_id: insertResult.meta.last_row_id,
		});
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return Response.json(
			{
				success: false,
				error: 'Thêm danh mục phương tiện thất bại ❌: ' + errorMessage,
			},
			{ status: 500 }
		);
	}
}
export async function deleteDanhmucphuongtien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'DELETE') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}
	try {
		const danhMucCount = await env.DB.prepare('SELECT COUNT(*) as count FROM DanhMucPhuongTien WHERE danh_muc_id = ?;').bind(id).all();
		const danhMucExists = Number(danhMucCount.results[0].count);

		if (danhMucExists === 0) {
			return Response.json({ success: false, error: `Không tìm thấy danh mục với ID ${id}` }, { status: 404 });
		}

		const phuongTienCount = await env.DB.prepare('SELECT COUNT(*) as count FROM PhuongTien WHERE danh_muc_id = ?;').bind(id).all();
		const phuongTienExists = Number(phuongTienCount.results[0].count);

		if (phuongTienExists > 0) {
			return Response.json(
				{
					success: false,
					error: `Xóa không thành công do danh mục ID ${id} này có trong bảng Phương Tiện.`,
				},
				{ status: 409 }
			);
		}

		await env.DB.prepare('DELETE FROM DanhMucPhuongTien WHERE danh_muc_id = ?;').bind(id).run();

		return Response.json({ success: true, message: 'Xóa danh mục phương tiện thành công' });
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return Response.json(
			{
				success: false,
				error: 'Xóa danh mục phương tiện thất bại ❌: ' + errorMessage,
			},
			{ status: 500 }
		);
	}
}
export async function putDanhmucphuongtien(request: Request, env: Env, id: string): Promise<Response> {
    if (request.method !== 'PUT') {
        return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
    }
    try {
        const body = (await request.json()) as {
            ten_danh_muc?: string;
            mo_ta?: string;
        };
        if (!body.ten_danh_muc && !body.mo_ta) {
            return Response.json({ success: false, error: 'Missing ten_danh_muc or mo_ta' }, { status: 400 });
        }

        const existingResult = await env.DB.prepare('SELECT COUNT(*) as count FROM DanhMucPhuongTien WHERE danh_muc_id = ?;').bind(id).all();
        const exists = Number(existingResult.results[0].count);
        if (exists === 0) {
            return Response.json({ success: false, error: `Không tìm thấy danh mục với ID ${id}` }, { status: 404 });
        }
        const updateFields = [];
        const updateValues = [];
        if (body.ten_danh_muc) {
            updateFields.push('ten_danh_muc = ?');
            updateValues.push(body.ten_danh_muc);
        }   
        if (body.mo_ta) {
            updateFields.push('mo_ta = ?');
            updateValues.push(body.mo_ta);
        }
        updateValues.push(id);
        const updateQuery = `UPDATE DanhMucPhuongTien SET ${updateFields.join(', ')} WHERE danh_muc_id = ?;`;
        await env.DB.prepare(updateQuery).bind(...updateValues).run();
        return Response.json({ success: true, message: 'Cập nhật danh mục phương tiện thành công' });
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return Response.json({ success: false, error: 'Cập nhật danh mục phương tiện thất bại ❌: ' + errorMessage }, { status: 500 });
    }
}