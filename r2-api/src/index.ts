import { handleGetUsers, handleCreateUser, handleUpdateUser, handleDeleteUser } from './admin/admin-users';
import { Env } from './type';

const jsonResponse = (data: any, status = 200) => {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	return new Response(JSON.stringify(data), { status, headers });
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return jsonResponse(null); 
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Định tuyến (Router)
            if (path === '/nguoi-dung') {
                if (request.method === 'GET') return handleGetUsers(env);
                if (request.method === 'POST') return handleCreateUser(request, env);
            }

            const userMatch = path.match(/^\/nguoi-dung\/(\d+)$/);
            if (userMatch) {
                const id = userMatch[1];
                if (request.method === 'PUT') return handleUpdateUser(request, env, id);
                if (request.method === 'DELETE') return handleDeleteUser(env, id);
            }

            // Route mặc định nếu không khớp
            return jsonResponse({ success: false, error: 'Route not found' }, 404);

        } catch (e: any) {
            console.error('API Error:', e);
            return jsonResponse({ success: false, error: e.message || 'Internal Server Error' }, 500);
        }
    },
};

