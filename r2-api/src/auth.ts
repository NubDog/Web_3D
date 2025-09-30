const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};
// Đây là hàm kiểm tra "vé" (token)
async function verifyAuth(request: Request, env: Env): Promise<Response | null> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ success: false, error: 'Authorization header is missing or invalid' }, 401);
    }

    const token = authHeader.substring(7); // Bỏ qua "Bearer "


    if (token !== "YOUR_SECRET_TOKEN_OR_JWT_LOGIC_HERE") {
        return jsonResponse({ success: false, error: 'Invalid token' }, 401);
    }
    
    return null;
}



export function withAuth(handler: (request: Request, env: Env) => Promise<Response>) {
    return async (request: Request, env: Env): Promise<Response> => {
        const authError = await verifyAuth(request, env);
        if (authError) {
            return authError; 
        }

        return handler(request, env);
    };
}