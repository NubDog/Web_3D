export interface Env {
    r2: R2Bucket;
    DB: D1Database;
}
// hiện tất cả chính sách giá
export async function getChinhSachGias(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    if (
        request.method === 'GET'
    ) {
        try {
            const result = await env.DB.prepare('SELECT * FROM ChinhSachGia;').all();
            return Response.json({ success: true, data: result.results });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return Response.json({ success: false, error: 'Query thất bại ❌: ' + errorMessage });
        }
    }
    return Response.json({ success: false, error: 'Method not allowed' });
}