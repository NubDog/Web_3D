interface Env {
	r2: R2Bucket;
	DB: D1Database;
	rental_db: D1Database;
	product: R2Bucket;
}

const jsonResponse = (data: any, status = 200) => {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	return new Response(JSON.stringify(data), { status, headers });
};

export async function handleGetFile(request: Request, env: Env, key: string): Promise<Response> {
	const object = await env.r2.get(key);

	if (object === null) {
		return jsonResponse({ success: false, error: 'File not found' }, 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('Cache-Control', 'public, max-age=31536000');

	return new Response(object.body, {
		headers,
	});
}

export async function handleUploadFile(request: Request, env: Env): Promise<Response> {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as unknown as File;

		if (!file) {
			return jsonResponse({ success: false, error: 'No file uploaded' }, 400);
		}
		
		const key = file.name;
		await env.r2.put(key, file.stream(), {
			httpMetadata: { contentType: file.type },
		});
		
		const url = `/file/${encodeURIComponent(key)}`;

		return jsonResponse({
			success: true,
			fileName: key,
			url: url,
			size: file.size,
			type: file.type,
		});
	} catch (error: any) {
		return jsonResponse({ success: false, error: error.message }, 500);
	}
}

export async function handleListFiles(request: Request, env: Env): Promise<Response> {
	const listResponse = await env.r2.list();
	const files = listResponse.objects.map(obj => ({
		key: obj.key,
		size: obj.size,
		uploaded: obj.uploaded.toISOString(),
		url: `/file/${encodeURIComponent(obj.key)}`,
	}));

	return jsonResponse({ success: true, files });
}

export async function handleDeleteFile(request: Request, env: Env, key: string): Promise<Response> {
	await env.r2.delete(key);
	return jsonResponse({ success: true, message: `File ${key} deleted` });
}

export async function handleGetProductImage(request: Request, env: Env, key: string): Promise<Response> {
    const object = await env.product.get(key);

    if (object === null) {
        return jsonResponse({ success: false, error: 'Product image not found' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
}