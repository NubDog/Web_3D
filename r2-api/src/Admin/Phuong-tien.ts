interface Env {
	r2: R2Bucket;
	product: R2Bucket;
	DB: D1Database;
}
// hiện tất cả phương tiện
function withCors(response: Response) {
	return new Response(response.body, {
		status: response.status,
		headers: {
			...Object.fromEntries(response.headers),
			'Access-Control-Allow-Origin': '*', // hoặc http://localhost:5173
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}

export async function getPhuongTiens(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	}

	// phần code logic của bạn ở đây
	const url = new URL(request.url);
	const path = url.pathname;

	if (request.method === 'GET') {
		try {
			const { searchParams } = url;
			const trang_thai = searchParams.get('trang_thai');
			const limit = searchParams.get('limit');
			const fields = searchParams.get('fields');

			let query = `
                SELECT 
                    ${fields || `p.*, d.ten_danh_muc, c.ten_chinh_sach, c.gia_co_ban, c.tien_coc_mac_dinh`}
                FROM PhuongTien p
                LEFT JOIN DanhMucPhuongTien d ON p.danh_muc_id = d.danh_muc_id
                LEFT JOIN ChinhSachGia c ON p.chinh_sach_id = c.chinh_sach_id
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
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}

	try {
		const result = await env.DB.prepare(
			`
      SELECT p.*,p.phuong_tien_id, p.ten_phuong_tien, p.bien_so, p.so_km, p.trang_thai,
             d.ten_danh_muc,p.*,	
             c.ten_chinh_sach, c.gia_co_ban, c.tien_coc_mac_dinh
			FROM PhuongTien p
			LEFT JOIN DanhMucPhuongTien d ON p.danh_muc_id = d.danh_muc_id
			LEFT JOIN ChinhSachGia c ON p.chinh_sach_id = c.chinh_sach_id
			WHERE p.phuong_tien_id = ?
			`
		)
			.bind(id)
			.all();

		if (result.results.length === 0) {
			return Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 });
		}

		return Response.json({ success: true, data: result.results[0] });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Query thất bại ❌: ' + err.message }, { status: 500 });
	}
}
// Thêm phương tiện mới

export async function addphuongtien(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}

	// --- KHAI BÁO BIẾN ---
	let hinh_anh_key: string | null = null; // Key R2 cho ảnh (dùng để rollback)
	let models_3d_key: string | null = null; // Key R2 cho models (dùng để rollback)
	let img_url: string | null = null;
	let model_url: string | null = null; // URL Models 3D để lưu vào D1

	// 💡 HẰNG SỐ PUBLIC DOMAIN CỦA BẠN (Cần thay thế!)
	const R2_IMG_DOMAIN = 'https://pub-51b489e1b34f440b9b9fee4220ce89c0.r2.dev';
	const R2_MODELS_DOMAIN = 'https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev'; // <--- THAY THẾ DOMAIN NÀY

	try {
		// 1. Đọc dữ liệu từ FormData
		const formData = await request.formData();

		// Lấy các trường dữ liệu
		const ten_phuong_tien = formData.get('ten_phuong_tien') as string;
		const loai = formData.get('loai') as string;
		const danh_muc_id = Number(formData.get('danh_muc_id'));
		const trang_thai = formData.get('trang_thai') as string;
		const bien_so = formData.get('bien_so') as string;
		const so_km = Number(formData.get('so_km'));
		const chinh_sach_id = Number(formData.get('chinh_sach_id'));
		const so_khung = formData.get('so_khung') as string;
		const gia_thue = Number(formData.get('gia_thue'));

		// Lấy File ảnh và Models 3D từ FormData
		const file = formData.get('file_anh') as File | null;
		const models = formData.get('models_3d') as File | null;

		// 2. Kiểm tra dữ liệu bắt buộc (Giữ nguyên)
		if (!ten_phuong_tien || !loai || !danh_muc_id || !trang_thai || !bien_so || !so_khung || !gia_thue) {
			return withCors(Response.json({ success: false, error: 'Thiếu thông tin phương tiện bắt buộc' }, { status: 400 }));
		}

		// 3. Xử lý Upload R2

		// --- A. Upload File Ảnh (env.product) ---
		if (file && file.size > 0) {
			if (!file.type.startsWith('image/')) {
				return withCors(Response.json({ success: false, error: 'File tải lên không phải là ảnh hợp lệ' }, { status: 400 }));
			}

			const file_id = crypto.randomUUID();
			const fileExtension = file.name.split('.').pop() || 'jpg';
			hinh_anh_key = `Product-img/${file_id}.${fileExtension}`;

			// ✅ Upload ảnh vào bucket 'product'
			await env.product.put(hinh_anh_key, file.stream(), {
				httpMetadata: { contentType: file.type },
			});
			img_url = `${R2_IMG_DOMAIN}/${hinh_anh_key}`;
		}

		// --- B. Upload Models 3D (env.r2) ---
		if (models && models.size > 0) {
			const modelExtension = models.name.split('.').pop()?.toLowerCase();

			// 💡 Bạn có thể cần thêm các định dạng models khác
			if (!modelExtension || !['glb', 'gltf', 'fbx', 'obj', 'zip'].includes(modelExtension)) {
				return withCors(
					Response.json({ success: false, error: 'File models không hợp lệ. Chỉ chấp nhận glb, gltf, fbx, obj, zip' }, { status: 400 })
				);
			}

			const model_id = crypto.randomUUID();

			// ✅ Key R2 cho Models: dùng prefix models-3d/Model Product/
			models_3d_key = `Model Product/${model_id}.${modelExtension}`;

			// ✅ Upload models vào bucket models (Giả định là env.r2)
			await env.r2.put(models_3d_key, models.stream(), {
				httpMetadata: { contentType: models.type || 'application/octet-stream' },
			});

			// Tạo URL công khai cho Models
			model_url = `${R2_MODELS_DOMAIN}/${models_3d_key}`;
		}

		// 4. Lưu thông tin (metadata) vào D1
		// ⚠️ D1 PHẢI CÓ THÊM CỘT model_url (hoặc tên cột tương ứng của bạn)
		const result = await env.DB.prepare(
			`INSERT INTO PhuongTien (ten_phuong_tien, loai, danh_muc_id, trang_thai, bien_so, so_km, chinh_sach_id, so_khung, gia_thue, img, model)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				ten_phuong_tien,
				loai,
				danh_muc_id,
				trang_thai,
				bien_so,
				so_km,
				chinh_sach_id,
				so_khung,
				gia_thue,
				img_url || null, // URL ảnh
				model_url || null // URL models 3D
			)
			.run();

		return withCors(Response.json({ success: true, message: 'Thêm phương tiện thành công', phuong_tien_id: result.meta.last_row_id }));
	} catch (err: any) {
		// --- XỬ LÝ ROLLBACK (QUAN TRỌNG) ---
		// 1. Rollback File Ảnh
		if (hinh_anh_key) {
			// ✅ Xóa từ bucket 'product'
			await env.product.delete(hinh_anh_key).catch((e) => console.error('Lỗi xóa file ảnh mồ côi:', e));
		}

		// 2. Rollback Models 3D
		if (models_3d_key) {
			// ✅ Xóa từ bucket 'models' (Giả định là env.r2)
			await env.r2.delete(models_3d_key).catch((e) => console.error('Lỗi xóa file model mồ côi:', e));
		}
		// --- KẾT THÚC ROLLBACK ---

		console.error('Lỗi khi thêm phương tiện:', err);
		return withCors(Response.json({ success: false, error: 'Thêm phương tiện thất bại ❌: ' + err.message }, { status: 500 }));
	}
}
// Cập nhật thông tin phương tiện
export async function updatePhuongTien(request: Request, env: Env, id: string): Promise<Response> {
	// Chỉ chấp nhận PUT
	if (request.method !== 'PUT') {
		return withCors(Response.json({ success: false, error: 'Method not allowed' }, { status: 405 }));
	}

	// --- KHAI BÁO BIẾN CHO R2 ---
	let new_hinh_anh_key: string | null = null;
	let new_models_3d_key: string | null = null;
	let img_url_to_save: string | null | undefined = undefined; // Undefined: không thay đổi; Null: xóa; String: URL mới
	let model_url_to_save: string | null | undefined = undefined;

	const R2_IMG_DOMAIN = 'https://pub-51b489e1b34f440b9b9fee4220ce89c0.r2.dev';
	const R2_MODELS_DOMAIN = 'https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev'; // Thay thế bằng domain models thực tế của bạn

	try {
		const formData = await request.formData();

		// 1. Tìm bản ghi hiện có
		// Cần lấy tất cả các cột, bao gồm img và model_url cũ.
		const existingRecord = await env.DB.prepare('SELECT * FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).first();

		if (!existingRecord) {
			return withCors(Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 }));
		}

		// Ép kiểu cho existingRecord để dễ sử dụng
		const existing: Record<string, any> = existingRecord as Record<string, any>;

		// --- LẤY DỮ LIỆU TỪ FORM DATA ---
		const getFormValue = (key: string) => formData.get(key) as string | null;

		const ten_phuong_tien = getFormValue('ten_phuong_tien');
		const loai = getFormValue('loai');
		const danh_muc_id = Number(getFormValue('danh_muc_id'));
		const trang_thai = getFormValue('trang_thai');
		const bien_so = getFormValue('bien_so');
		const so_km = Number(getFormValue('so_km'));
		let chinh_sach_id = Number(getFormValue('chinh_sach_id'));
		const so_khung = getFormValue('so_khung');
		const gia_thue = Number(getFormValue('gia_thue'));

		const file = formData.get('file_anh') as File | null;
		const models = formData.get('models_3d') as File | null;

		// --- XỬ LÝ CHÍNH SÁCH VÀ TRẠNG THÁI ---
		// Nếu gia_thue được gửi lên, tính lại chinh_sach_id
		const final_gia_thue = gia_thue || existing.gia_thue;
		if (final_gia_thue > 0 && final_gia_thue <= 1000000) {
			chinh_sach_id = 1;
		} else if (final_gia_thue > 1000000 && final_gia_thue <= 10000000) {
			chinh_sach_id = 2;
		} else if (final_gia_thue > 10000000) {
			chinh_sach_id = 3;
		}

		// --- 2. XỬ LÝ UPLOAD R2 VÀ CẬP NHẬT KEY/URL ---

		// A. Xử lý File Ảnh
		if (file && file.size > 0) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				return withCors(Response.json({ success: false, error: 'File tải lên không phải là ảnh hợp lệ' }, { status: 400 }));
			}
			// Tạo Key mới
			const file_id = crypto.randomUUID();
			const fileExtension = file.name.split('.').pop() || 'jpg';
			new_hinh_anh_key = `Product-img/${file_id}.${fileExtension}`;

			// Upload ảnh mới
			await env.product.put(new_hinh_anh_key, file.stream(), {
				httpMetadata: { contentType: file.type },
			});
			img_url_to_save = `${R2_IMG_DOMAIN}/${new_hinh_anh_key}`;
		} else if (formData.has('file_anh') && file?.size === 0) {
			// Nếu người dùng gửi trường file_anh nhưng để trống (dấu hiệu muốn xóa ảnh)
			img_url_to_save = null;
		}
		// Nếu không có trường file_anh trong FormData, img_url_to_save vẫn là undefined (không thay đổi)

		// B. Xử lý Models 3D
		if (models && models.size > 0) {
			const modelExtension = models.name.split('.').pop()?.toLowerCase();
			if (!modelExtension || !['glb', 'gltf', 'fbx', 'obj', 'zip'].includes(modelExtension)) {
				return withCors(Response.json({ success: false, error: 'File models không hợp lệ' }, { status: 400 }));
			}

			// Tạo Key mới
			const model_id = crypto.randomUUID();
			new_models_3d_key = `Model Product/${model_id}.${modelExtension}`;

			// Upload models mới
			await env.r2.put(new_models_3d_key, models.stream(), {
				httpMetadata: { contentType: models.type || 'application/octet-stream' },
			});
			model_url_to_save = `${R2_MODELS_DOMAIN}/${new_models_3d_key}`;
		} else if (formData.has('models_3d') && models?.size === 0) {
			// Nếu người dùng gửi trường models_3d nhưng để trống (dấu hiệu muốn xóa models)
			model_url_to_save = null;
		}

		// --- 3. TẠO FINAL VALUES VÀ XÓA FILE CŨ (NẾU CÓ) ---

		// 3.1. Xác định URL cũ và URL mới
		const old_img_url: string | null = existing.img;
		// Support existing DB column named either `model` or `model_url`.
		const old_model_url: string | null = (existing.model as string) ?? (existing.model_url as string) ?? null;

		const final_img_url = img_url_to_save === undefined ? old_img_url : img_url_to_save;
		const final_model_url = model_url_to_save === undefined ? old_model_url : model_url_to_save;

		// 3.2. Xóa file cũ
		if (new_hinh_anh_key || final_img_url === null) {
			if (old_img_url) {
				// Tách Key cũ từ URL để xóa
				const old_img_key = old_img_url.replace(`${R2_IMG_DOMAIN}/`, '');
				await env.product.delete(old_img_key).catch((e) => console.error('Lỗi xóa ảnh cũ:', e));
			}
		}

		if (new_models_3d_key || final_model_url === null) {
			if (old_model_url) {
				// Tách Key cũ từ URL để xóa
				const old_model_key = old_model_url.replace(`${R2_MODELS_DOMAIN}/`, '');
				await env.r2.delete(old_model_key).catch((e) => console.error('Lỗi xóa models cũ:', e));
			}
		}

		// 3.3. Tạo đối tượng chứa các giá trị cuối cùng để cập nhật D1
		const finalValues = {
			ten_phuong_tien: ten_phuong_tien ?? existing.ten_phuong_tien,
			loai: loai ?? existing.loai,
			danh_muc_id: danh_muc_id || existing.danh_muc_id,
			trang_thai: trang_thai ?? existing.trang_thai,
			bien_so: bien_so ?? existing.bien_so,
			so_km: so_km || existing.so_km,
			chinh_sach_id: chinh_sach_id || existing.chinh_sach_id,
			so_khung: so_khung ?? existing.so_khung,
			gia_thue: final_gia_thue,
			img: final_img_url, // URL mới/cũ/null
			model: final_model_url, // URL mới/cũ/null (DB column is `model`)
		};

		// 4. Cập nhật vào cơ sở dữ liệu.
		const updateKeys = Object.keys(finalValues).join(' = ?, ') + ' = ?'; // Tạo chuỗi SET key = ?, key2 = ?...
		const updateValues = Object.values(finalValues).map((value) => (value === undefined || value === 0 ? null : value));

		await env.DB.prepare(
			`UPDATE PhuongTien
             SET ${updateKeys}
             WHERE phuong_tien_id = ?`
		)
			.bind(...updateValues, id)
			.run();

		return withCors(Response.json({ success: true, message: 'Cập nhật phương tiện thành công' }));
	} catch (err: any) {
		// --- XỬ LÝ ROLLBACK (XÓA FILE MỚI ĐƯỢC UPLOAD NẾU D1 THẤT BẠI) ---

		// 1. Rollback File Ảnh mới
		if (new_hinh_anh_key) {
			await env.product.delete(new_hinh_anh_key).catch((e) => console.error('Lỗi xóa ảnh mới mồ côi:', e));
		}

		// 2. Rollback Models 3D mới
		if (new_models_3d_key) {
			await env.r2.delete(new_models_3d_key).catch((e) => console.error('Lỗi xóa models mới mồ côi:', e));
		}
		// --- KẾT THÚC ROLLBACK ---

		console.error('Lỗi khi cập nhật phương tiện:', err);
		return withCors(Response.json({ success: false, error: 'Lỗi khi cập nhật phương tiện', details: err.message }, { status: 500 }));
	}
}
// Xoá phương tiện
export async function deletePhuongTien(request: Request, env: Env, id: string): Promise<Response> {
	if (request.method !== 'DELETE') {
		return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
	}
	try {
		// Sử dụng .first() để kiểm tra sự tồn tại, nó an toàn hơn.
		const existing = await env.DB.prepare('SELECT phuong_tien_id FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).first();

		if (!existing) {
			return Response.json({ success: false, error: 'Không tìm thấy phương tiện' }, { status: 404 });
		}

		// Xoá phương tiện
		await env.DB.prepare('DELETE FROM PhuongTien WHERE phuong_tien_id = ?').bind(id).run();

		return Response.json({ success: true, message: 'Xoá phương tiện thành công' });
	} catch (err: any) {
		return Response.json({ success: false, error: 'Lỗi khi xoá phương tiện', details: err.message }, { status: 500 });
	}
}
