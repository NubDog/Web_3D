import { ConfigRequest, ConfigResponse } from '../../../config/app.config';

export interface Env {
	DB: D1Database;
}

export async function handleGetConfig(env: Env): Promise<Response> {
	try {
		const result = await env.DB.prepare(
			`SELECT 
       *
      FROM app_config 
      WHERE id = 1`,
		).first();

		if (!result) {
			return Response.json({
				success: false,
				error: 'Config not found',
			});
		}

		const qrBaseUrl = `https://img.vietqr.io/image/${result.bank_code}-${result.account_number}-compact2.png`;

		const config = {
			CONTACT: {
				HOTLINE: result.hotline as string,
				SUPPORT_EMAIL: result.support_email as string,
			},
			PAYMENT: {
				BANK_CODE: result.bank_code as string,
				BANK_NAME: result.bank_name as string,
				ACCOUNT_NUMBER: result.account_number as string,
				ACCOUNT_NAME: result.account_name as string,
				QR_BASE_URL: qrBaseUrl,
			},
			VIOLATIONS: {
				BLOCK_THRESHOLDS: {
					MIN_DEBT: result.min_debt as number,
					MIN_COUNT: result.min_violation_count as number,
				},
				EMAIL: {
					SUBJECT_BLOCKED: '⛔ TÀI KHOẢN BỊ KHÓA DO VI PHẠM',
					REASON_DEBT: 'Tổng số tiền vi phạm vượt quá ngưỡng',
					REASON_COUNT: 'Số lần vi phạm vượt quá ngưỡng',
					AFTER_PAYMENT_NOTE: 'Vui lòng thanh toán để mở khóa tài khoản',
					SUBJECT_VIOLATION: '⚠️ Thông báo vi phạm giao thông',
					SUBJECT_PAYMENT_CONFIRMED: '✅ Xác nhận thanh toán vi phạm',
					SUBJECT_VIOLATION_CANCELLED: '🔄 Thông báo hủy vi phạm',
				},
			},
			Locations: {
				DIACHISHOP: result.shop_address as string,
				CHINHANHTP: result.city as string,
			},
			EMAIL: {
				FROM_NAME: result.email_from_name as string,
				FROM_EMAIL: result.email_from_address as string,
			},
			MAINTENANCE: {
				HAN_BAO_TRI_PHUONG_TIEN: result.han_bao_tri_phuong_tien as number,
			},
			FRONTEND: {
				BASE_URL: 'http://localhost:5173',
				VIOLATION_PATH: '/user/violations',
			},
			DB: {
				USER_STATUS: {
					ACTIVE: 'active' as const,
					BLOCKED: 'inactive' as const,
				},
			},
		};

		return Response.json({
			success: true,
			data: config,
			updated_at: result.updated_at as string,
		});
	} catch (err: any) {
		console.error('Error getting config:', err);
		return Response.json(
			{
				success: false,
				error: err.message,
			},
			{ status: 500 },
		);
	}
}

export async function handleSaveConfig(request: Request, env: Env): Promise<Response> {
	try {
		const body = (await request.json()) as ConfigRequest;

		if (!body.CONTACT || !body.PAYMENT || !body.VIOLATIONS || !body.Locations || !body.EMAIL) {
			return Response.json(
				{
					success: false,
					error: 'Thiếu thông tin cấu hình bắt buộc',
				},
				{ status: 400 },
			);
		}

		if (!body.CONTACT.HOTLINE || body.CONTACT.HOTLINE.trim() === '') {
			return Response.json(
				{
					success: false,
					error: 'Hotline không được để trống',
				},
				{ status: 400 },
			);
		}
		if (!body.PAYMENT.BANK_CODE || body.PAYMENT.BANK_CODE.trim() === '') {
			return Response.json(
				{
					success: false,
					error: 'Mã ngân hàng không được để trống',
				},
				{ status: 400 },
			);
		}
		if (
			!body.MAINTENANCE ||
			typeof body.MAINTENANCE.HAN_BAO_TRI_PHUONG_TIEN !== 'number' ||
			body.MAINTENANCE.HAN_BAO_TRI_PHUONG_TIEN <= 0
		) {
			return Response.json(
				{
					success: false,
					error: 'Hạn bảo trì phương tiện phải là số tháng hợp lệ',
				},
				{ status: 400 },
			);
		}

		await env.DB.prepare(
			`UPDATE app_config SET
        hotline = ?,
        support_email = ?,
        bank_code = ?,
        bank_name = ?,
        account_number = ?,
        account_name = ?,
        qr_base_url = ?,
        min_debt = ?,
        min_violation_count = ?,
        shop_address = ?,
        city = ?,
        email_from_name = ?,
        email_from_address = ?,
        han_bao_tri_phuong_tien = ?,
        updated_at = datetime('now')
      WHERE id = 1`,
		)
			.bind(
				body.CONTACT.HOTLINE,
				body.CONTACT.SUPPORT_EMAIL,
				body.PAYMENT.BANK_CODE,
				body.PAYMENT.BANK_NAME,
				body.PAYMENT.ACCOUNT_NUMBER,
				body.PAYMENT.ACCOUNT_NAME,
				body.PAYMENT.QR_BASE_URL,
				body.VIOLATIONS.BLOCK_THRESHOLDS.MIN_DEBT,
				body.VIOLATIONS.BLOCK_THRESHOLDS.MIN_COUNT,
				body.Locations.DIACHISHOP,
				body.Locations.CHINHANHTP,
				body.EMAIL.FROM_NAME,
				body.EMAIL.FROM_EMAIL,
				body.MAINTENANCE.HAN_BAO_TRI_PHUONG_TIEN,
			)
			.run();

		return Response.json({
			success: true,
			message: 'Lưu cấu hình thành công',
		});
	} catch (err: any) {
		console.error('Error saving config:', err);
		return Response.json(
			{
				success: false,
				error: err.message,
			},
			{ status: 500 },
		);
	}
}
