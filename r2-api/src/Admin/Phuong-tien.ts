import { env } from 'cloudflare:workers';

interface Env {
	r2: R2Bucket;
	product: R2Bucket;
	DB: D1Database;
}
// Hàm lấy thời gian hiện tại theo giờ Việt Nam (UTC+7)
function getNowVN(): string {
	const now = new Date();
	const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
	return vnTime.toISOString().slice(0, 19).replace('T', ' ');
}

function withCors(response: Response) {
	return new Response(response.body, {
		status: response.status,
		headers: {
			...Object.fromEntries(response.headers),
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}

export async function getPhuongTiens(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);

	if (request.method === 'GET') {
		try {
			const { searchParams } = url;
			const trang_thai = searchParams.get('trang_thai');
			const limit = searchParams.get('limit');
			const fields = searchParams.get('fields');

			let query = `
                SELECT 
                    ${
											fields ||
											`p.*, d.ten_danh_muc, c.ten_chinh_sach, c.gia_co_ban, c.tien_coc_mac_dinh, pl.ten_phan_loai,nd.ten_dang_nhap as nguoi_thay_doi_chinh_sach_gia`
										}
                FROM PhuongTien p
              
                LEFT JOIN ChinhSachGia c ON p.chinh_sach_id = c.chinh_sach_id
				LEFT JOIN PhanLoaiPhuongTien pl ON p.phan_loai_id = pl.phan_loai_id
				LEFT JOIN DanhMucPhuongTien d ON d.danh_muc_id = pl.danh_muc_id
				LEFT JOIN NguoiDung nd ON p.nguoi_thay_doi_chinh_sach_gia_id = nd.nguoi_dung_id
            `;

			const queryParams: (string | number)[] = [];

			if (trang_thai) {
				query += ` WHERE p.trang_thai = ?`;
				queryParams.push(trang_thai);
			}

			if (limit) {
				query += ` LIMIT ?`;
				queryParams.push(parseInt(limit, 10));
			}

			const stmt = env.DB.prepare(query).bind(...queryParams);
			const result = await stmt.all();

			return withCors(Response.json({ success: true, data: result.results }));
		} catch (err: any) {
			return withCors(Response.json({ success: false, error: 'Query thất bại ❌: ' + err.message }, { status: 500 }));
		}
	}

	return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
}

// Hiện chi tiết phương tiện theo ID
export async function getPhuongTienById(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'GET') {
		return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}

	try {
		const result = await env.DB.prepare(
			`
			SELECT 
				p.phuong_tien_id,
				p.ten_phuong_tien,
				p.bien_so,
				p.so_km,
				p.trang_thai,
				p.loai,
				p.danh_muc_id,
				p.chinh_sach_id,
				p.so_khung,
				p.gia_thue,
				p.img,
				p.model,
				p.ngay_tao,
				p.ngay_cap_nhat,
				p.phan_loai_id,
				p.ngay_update_chinh_sach_gia,
				d.ten_danh_muc,
				c.ten_chinh_sach,
				c.gia_co_ban,
				c.tien_coc_mac_dinh,
				pl.ten_phan_loai,
				nd.ten_dang_nhap as nguoi_thay_doi_chinh_sach_gia
			FROM PhuongTien p
			
			LEFT JOIN ChinhSachGia c ON p.chinh_sach_id = c.chinh_sach_id
			LEFT JOIN PhanLoaiPhuongTien pl ON p.phan_loai_id = pl.phan_loai_id
			LEFT JOIN DanhMucPhuongTien d ON pl.danh_muc_id = d.danh_muc_id
			LEFT JOIN NguoiDung nd ON p.nguoi_thay_doi_chinh_sach_gia_id = nd.nguoi_dung_id
			WHERE p.phuong_tien_id = ?
			`,
		)
			.bind(id)
			.all();

		if (result.results.length === 0) {
			return withCors(Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 }));
		}

		return withCors(Response.json({ success: true, data: result.results[0] }));
	} catch (err: any) {
		return withCors(Response.json({ success: false, error: 'Query thất bại ❌: ' + err.message }, { status: 500 }));
	}
}

// Thêm phương tiện mới
export async function addphuongtien(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}

	let imgKey: string | null = null;
	let modelKey: string | null = null;

	const R2_IMG_DOMAIN = 'https://pub-51b489e1b34f440b9b9fee4220ce89c0.r2.dev';
	const R2_MODEL_DOMAIN = 'https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev';

	try {
		console.time('formData');
		const formData = await request.formData();
		console.timeEnd('formData');

		const ten_phuong_tien = formData.get('ten_phuong_tien') as string;
		const loai = formData.get('loai') as string;
		// const danh_muc_id = Number(formData.get('danh_muc_id'));
		const trang_thai = formData.get('trang_thai') as string;
		const bien_so = formData.get('bien_so') as string;
		const so_km = Number(formData.get('so_km'));
		const chinh_sach_id = Number(formData.get('chinh_sach_id'));
		const nguoi_dung_id = formData.get('nguoi_dung_id');
		const so_khung = formData.get('so_khung') as string;
		const gia_thue = Number(formData.get('gia_thue'));
		const ngay_cap_nhat = null;
		const ngay_tao = getNowVN();
		const phan_loai_id = Number(formData.get('phan_loai_id'));
		const ngay_update_chinh_sach_gia = getNowVN();

		// Lấy hạn bảo trì từ config
		const configResult = await env.DB.prepare(`SELECT han_bao_tri_phuong_tien FROM app_config LIMIT 1`).first<{
			han_bao_tri_phuong_tien: number;
		}>();
		const hanBaoTriMonths = configResult?.han_bao_tri_phuong_tien || 6; // Mặc định 6 tháng nếu không tìm thấy

		const now = new Date();
		now.setMonth(now.getMonth() + hanBaoTriMonths);
		const hanbaotri = now.toISOString().slice(0, 10);
		const duplicateCheck = await env.DB.prepare(`SELECT 1 FROM PhuongTien WHERE bien_so = ? OR so_khung = ? LIMIT 1`)
			.bind(bien_so, so_khung)
			.first();

		if (duplicateCheck) {
			return withCors(Response.json({ success: false, error: 'Trùng biển số hoặc số khung!' }, { status: 409 }));
		}
		if (
			!ten_phuong_tien ||
			!loai ||
			!trang_thai ||
			!bien_so ||
			!so_khung ||
			!gia_thue ||
			!phan_loai_id ||
			!chinh_sach_id ||
			!nguoi_dung_id
		) {
			return withCors(Response.json({ success: false, error: 'Thiếu dữ liệu bắt buộc' }, { status: 400 }));
		}

		const imgFile = formData.get('file_anh') as File | null;
		const modelFile = formData.get('models_3d') as File | null;

		const uploadTasks: Promise<any>[] = [];

		let imgUrl: string | null = null;
		let modelUrl: string | null = null;

		// -------- Upload Ảnh ----------
		if (imgFile && imgFile.size > 0) {
			if (!imgFile.type.startsWith('image/')) {
				return withCors(Response.json({ success: false, error: 'File ảnh không hợp lệ' }, { status: 400 }));
			}

			const ext = imgFile.name;
			imgKey = `Product-img/${ext}`;

			uploadTasks.push(
				env.product
					.put(imgKey, imgFile.stream(), {
						httpMetadata: { contentType: imgFile.type },
					})
					.then(() => {
						imgUrl = `${R2_IMG_DOMAIN}/${imgKey}`;
					}),
			);
		}

		// -------- Upload Model ----------
		if (modelFile && modelFile.size > 0) {
			const modelExtension = modelFile.name;
			const ext = modelFile.name.split('.').pop()?.toLowerCase();
			if (!ext || !['glb', 'gltf', 'fbx', 'obj', 'zip'].includes(ext)) {
				return withCors(Response.json({ success: false, error: 'Model 3D không hợp lệ' }, { status: 400 }));
			}

			modelKey = `Model Product/${modelExtension}`;

			uploadTasks.push(
				env.r2
					.put(modelKey, modelFile.stream(), {
						httpMetadata: { contentType: modelFile.type || 'application/octet-stream' },
					})
					.then(() => {
						modelUrl = `${R2_MODEL_DOMAIN}/${modelKey}`;
					}),
			);
		}

		console.time('uploadR2');
		await Promise.all(uploadTasks);
		console.timeEnd('uploadR2');

		const result = await env.DB.prepare(
			`
      INSERT INTO PhuongTien
      (ten_phuong_tien, loai, trang_thai, bien_so, so_km, chinh_sach_id, so_khung, gia_thue, img, model, hanBaoTri, ngay_cap_nhat, ngay_tao, phan_loai_id, nguoi_thay_doi_chinh_sach_gia_id,ngay_update_chinh_sach_gia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
		)
			.bind(
				ten_phuong_tien,
				loai,
				trang_thai,
				bien_so,
				so_km,
				chinh_sach_id,
				so_khung,
				gia_thue,
				imgUrl,
				modelUrl,
				hanbaotri,
				ngay_cap_nhat,
				ngay_tao,
				phan_loai_id,
				nguoi_dung_id,
				ngay_update_chinh_sach_gia,
			)
			.run();

		return withCors(
			Response.json({
				success: true,
				message: 'Thêm phương tiện thành công',
				phuong_tien_id: result.meta.last_row_id,
			}),
		);
	} catch (err: any) {
		if (imgKey) await env.product.delete(imgKey).catch(() => {});
		if (modelKey) await env.r2.delete(modelKey).catch(() => {});

		console.error(err);
		return withCors(Response.json({ success: false, error: err.message }, { status: 500 }));
	}
}

// Cập nhật thông tin phương tiện
export async function updatePhuongTien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'PUT') {
		return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}

	let new_hinh_anh_key: string | null = null;
	let new_models_3d_key: string | null = null;
	let img_url_to_save: string | null | undefined = undefined;
	let model_url_to_save: string | null | undefined = undefined;

	const R2_IMG_DOMAIN = 'https://pub-51b489e1b34f440b9b9fee4220ce89c0.r2.dev';
	const R2_MODELS_DOMAIN = 'https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev';

	try {
		const formData = await request.formData();

		const existingRecord = await env.DB.prepare('SELECT * FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).first();

		if (!existingRecord) {
			return withCors(Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 }));
		}

		const existing: Record<string, any> = existingRecord as Record<string, any>;
		const getFormValue = (key: string) => formData.get(key) as string | null;

		// Check trùng bien_so và so_khung (loại trừ ID hiện tại)
		const bien_so = getFormValue('bien_so');
		const so_khung = getFormValue('so_khung');

		if (bien_so && bien_so !== existing.bien_so) {
			const duplicateBienSo = await env.DB.prepare(`SELECT 1 FROM PhuongTien WHERE bien_so = ? AND phuong_tien_id != ? LIMIT 1`)
				.bind(bien_so, id)
				.first();
			if (duplicateBienSo) {
				return withCors(Response.json({ success: false, error: 'Biển số đã tồn tại!' }, { status: 409 }));
			}
		}

		if (so_khung && so_khung !== existing.so_khung) {
			const duplicateSoKhung = await env.DB.prepare(`SELECT 1 FROM PhuongTien WHERE so_khung = ? AND phuong_tien_id != ? LIMIT 1`)
				.bind(so_khung, id)
				.first();
			if (duplicateSoKhung) {
				return withCors(Response.json({ success: false, error: 'Số khung đã tồn tại!' }, { status: 409 }));
			}
		}

		const ten_phuong_tien = getFormValue('ten_phuong_tien');
		const loai = getFormValue('loai');
		const trang_thai = getFormValue('trang_thai');
		// const bien_so = getFormValue('bien_so');
		const so_km = getFormValue('so_km') ? Number(getFormValue('so_km')) : null;
		const new_chinh_sach_id = getFormValue('chinh_sach_id') ? Number(getFormValue('chinh_sach_id')) : null;
		// const so_khung = getFormValue('so_khung');
		const gia_thue = getFormValue('gia_thue') ? Number(getFormValue('gia_thue')) : null;
		const phan_loai_id = getFormValue('phan_loai_id') ? Number(getFormValue('phan_loai_id')) : null;
		const nguoi_dung_id = getFormValue('nguoi_dung_id') ? Number(getFormValue('nguoi_dung_id')) : null; // ID người thực hiện từ Frontend

		const file = formData.get('file_anh') as File | null;
		const models = formData.get('models_3d') as File | null;
		const ngay_update_chinh_sach_gia = getNowVN();

		if (file && file.size > 0) {
			if (!file.type.startsWith('image/')) {
				return withCors(Response.json({ success: false, error: 'File tải lên không phải là ảnh hợp lệ' }, { status: 400 }));
			}
			const file_id = crypto.randomUUID();
			const fileExtension = file.name.split('.').pop() || 'jpg';
			new_hinh_anh_key = `Product-img/${file_id}.${fileExtension}`;

			await env.product.put(new_hinh_anh_key, file.stream(), {
				httpMetadata: { contentType: file.type },
			});
			img_url_to_save = `${R2_IMG_DOMAIN}/${new_hinh_anh_key}`;
		} else if (formData.has('file_anh') && file?.size === 0) {
			img_url_to_save = null;
		}

		if (models && models.size > 0) {
			const modelExtension = models.name.split('.').pop()?.toLowerCase();
			if (!modelExtension || !['glb', 'gltf', 'fbx', 'obj', 'zip'].includes(modelExtension)) {
				return withCors(Response.json({ success: false, error: 'File models không hợp lệ' }, { status: 400 }));
			}
			const model_id = crypto.randomUUID();
			new_models_3d_key = `Model Product/${model_id}.${modelExtension}`;

			await env.r2.put(new_models_3d_key, models.stream(), {
				httpMetadata: { contentType: models.type || 'application/octet-stream' },
			});
			model_url_to_save = `${R2_MODELS_DOMAIN}/${new_models_3d_key}`;
		} else if (formData.has('models_3d') && models?.size === 0) {
			model_url_to_save = null;
		}

		const old_img_url: string | null = existing.img;
		const old_model_url: string | null = existing.model || null;

		const final_img_url = img_url_to_save === undefined ? old_img_url : img_url_to_save;
		const final_model_url = model_url_to_save === undefined ? old_model_url : model_url_to_save;

		if (new_hinh_anh_key || final_img_url === null) {
			if (old_img_url) {
				const old_img_key = old_img_url.replace(`${R2_IMG_DOMAIN}/`, '');
				await env.product.delete(old_img_key).catch((e) => console.error('Lỗi xóa ảnh cũ:', e));
			}
		}
		if (new_models_3d_key || final_model_url === null) {
			if (old_model_url) {
				const old_model_key = old_model_url.replace(`${R2_MODELS_DOMAIN}/`, '');
				await env.r2.delete(old_model_key).catch((e) => console.error('Lỗi xóa models cũ:', e));
			}
		}

		let final_nguoi_thay_doi_id = existing.nguoi_thay_doi_chinh_sach_gia_id;
		let final_ngay_update_chinh_sach_gia = existing.ngay_update_chinh_sach_gia;

		console.log('📊 Kiểm tra chinh_sach_id:', {
			new_chinh_sach_id,
			old_chinh_sach_id: existing.chinh_sach_id,
			changed: new_chinh_sach_id !== null && new_chinh_sach_id !== existing.chinh_sach_id,
			nguoi_dung_id,
		});

		if (new_chinh_sach_id !== null && new_chinh_sach_id !== existing.chinh_sach_id) {
			console.log('✅ Chinh sách giá thay đổi! Lưu nguoi_dung_id:', nguoi_dung_id);
			final_nguoi_thay_doi_id = nguoi_dung_id;
			final_ngay_update_chinh_sach_gia = ngay_update_chinh_sach_gia;
		}

		const finalValues = {
			ten_phuong_tien: ten_phuong_tien ?? existing.ten_phuong_tien,
			loai: loai ?? existing.loai,
			trang_thai: trang_thai ?? existing.trang_thai,
			bien_so: bien_so ?? existing.bien_so,
			so_km: so_km !== null ? so_km : existing.so_km,
			chinh_sach_id: new_chinh_sach_id !== null ? new_chinh_sach_id : existing.chinh_sach_id,
			so_khung: so_khung ?? existing.so_khung,
			gia_thue: gia_thue !== null ? gia_thue : existing.gia_thue,
			img: final_img_url,
			model: final_model_url,
			ngay_cap_nhat: getNowVN(),
			phan_loai_id: phan_loai_id !== null ? phan_loai_id : existing.phan_loai_id,
			nguoi_thay_doi_chinh_sach_gia_id: final_nguoi_thay_doi_id,
			ngay_update_chinh_sach_gia: final_ngay_update_chinh_sach_gia,
		};

		const updateKeys = Object.keys(finalValues).join(' = ?, ') + ' = ?';
		const updateValues = Object.values(finalValues);

		console.log('🔄 UPDATE values:', finalValues);
		console.log('🔄 UPDATE query:', `UPDATE PhuongTien SET ${updateKeys} WHERE phuong_tien_id = ?`);

		const result = await env.DB.prepare(
			`UPDATE PhuongTien
             SET ${updateKeys}
             WHERE phuong_tien_id = ?`,
		)
			.bind(...updateValues, id)
			.run();

		console.log('✅ UPDATE result:', result);

		return withCors(Response.json({ success: true, message: 'Cập nhật phương tiện thành công' }));
	} catch (err: any) {
		if (new_hinh_anh_key) await env.product.delete(new_hinh_anh_key).catch(() => {});
		if (new_models_3d_key) await env.r2.delete(new_models_3d_key).catch(() => {});

		console.error('Lỗi khi cập nhật phương tiện:', err);
		return withCors(
			Response.json(
				{
					success: false,
					error: 'Lỗi khi cập nhật phương tiện',
					details: err.message,
				},
				{ status: 500 },
			),
		);
	}
}
// Xoá phương tiện
export async function deletePhuongTien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'DELETE') {
		return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}

	try {
		const numericId = Number(id);
		if (isNaN(numericId)) {
			return withCors(Response.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 }));
		}

		const phuongTien = await env.DB.prepare(
			`SELECT phuong_tien_id, trang_thai
				 FROM PhuongTien
				 WHERE phuong_tien_id = ?`,
		)
			.bind(numericId)
			.first<{
				phuong_tien_id: number;
				trang_thai: string;
			}>();

		if (!phuongTien) {
			return withCors(Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 }));
		}

		if (phuongTien.trang_thai === 'DA_DAT' || phuongTien.trang_thai === 'BAO_TRI') {
			return withCors(
				Response.json(
					{
						success: false,
						error: 'Không thể xoá phương tiện khi đang Đã đặt hoặc Bảo trì',
					},
					{ status: 400 },
				),
			);
		}

		await env.DB.prepare('DELETE FROM PhuongTien WHERE phuong_tien_id = ?').bind(numericId).run();

		return withCors(Response.json({ success: true, message: 'Xoá phương tiện thành công' }));
	} catch (err: any) {
		console.error('DELETE PHUONG TIEN ERROR:', err);
		return withCors(
			Response.json(
				{
					success: false,
					error: 'Lỗi khi xoá phương tiện',
					details: err.message,
				},
				{ status: 500 },
			),
		);
	}
}
