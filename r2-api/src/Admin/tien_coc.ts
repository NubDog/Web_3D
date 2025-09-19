const jsonResponse = (data: any, status = 200) => {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	return new Response(JSON.stringify(data), { status, headers });
};

export interface Env {
  DB: D1Database;
}

export const handleConfirmDeposit = async (request: Request, env: Env, depositId: string) => {
    try {
        const stmt = env.DB.prepare(
            `UPDATE TienCoc SET trang_thai = 'DANG_GIU' WHERE tien_coc_id = ?`
        );
        await stmt.bind(depositId).run();

        return jsonResponse({ success: true, message: "Cập nhật trạng thái tiền cọc thành công." });

    } catch (e: any) {
        console.error("API Error in handleConfirmDeposit:", e);
        return jsonResponse({ success: false, error: e.message }, 500);
    }
};