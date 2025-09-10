interface Env {
	ua: R2Bucket;
	DB: D1Database;
    r2: R2Bucket;
}

const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
});

export const handleImageUpload = async (request: Request, env: Env) => {
    try {
        const formData = await request.formData();
        const file = formData.get('avatar') as unknown as File;
        if (!file) return jsonResponse({ success: false, error: 'Không tìm thấy file' }, 400);

        const fileExtension = file.name.split('.').pop();
        const uniqueKey = `avatars/${Date.now()}.${fileExtension}`;

        await env.ua.put(uniqueKey, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type },
        });

        const publicUrl = `https://pub-835d991ae08743e2937fa6d3c13f82df.r2.dev/${uniqueKey}`;
        
        return jsonResponse({ success: true, url: publicUrl });

    } catch (e: any) {
        return jsonResponse({ success: false, error: 'Tải ảnh lên thất bại', details: e.message }, 500);
    }
};