/**
 * R2 API Worker for handling file operations
 */

interface Env {
  r2: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // R2 Public URL của bạn
    const R2_PUBLIC_URL = 'https://pub-caec26941f1449dab2d3b0817e5f01b9.r2.dev';

    // CORS headers cho localhost
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Xử lý preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    try {
      // ==================== UPLOAD FILE ====================
      if (path === '/upload' && request.method === 'POST') {
        console.log('📤 Processing file upload...');
        
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'No file provided' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Tạo tên file unique
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        
        console.log(`📁 Uploading file: ${fileName}, Size: ${file.size} bytes`);

        // Upload to R2
        await env.r2.put(fileName, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });

        const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

        console.log(`✅ Upload successful: ${fileName}`);

        return new Response(JSON.stringify({ 
          success: true, 
          fileName,
          url: publicUrl,
          size: file.size,
          type: file.type
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==================== LIST FILES ====================
      if (path === '/files' && request.method === 'GET') {
        console.log('📋 Fetching files list...');
        
        const objects = await env.r2.list();
        const files = objects.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          url: `${R2_PUBLIC_URL}/${obj.key}`
        }));

        console.log(`📁 Found ${files.length} files`);

        return new Response(JSON.stringify({ 
          success: true,
          files 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==================== DELETE FILE ====================
      if (path.startsWith('/delete/') && request.method === 'DELETE') {
        const fileName = decodeURIComponent(path.split('/delete/')[1]);
        
        if (!fileName) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'No filename provided' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`🗑️ Deleting file: ${fileName}`);

        await env.r2.delete(fileName);

        console.log(`✅ Delete successful: ${fileName}`);

        return new Response(JSON.stringify({ 
          success: true,
          message: `File ${fileName} deleted successfully`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==================== GET FILE INFO ====================
      if (path.startsWith('/file/') && request.method === 'GET') {
        const fileName = decodeURIComponent(path.split('/file/')[1]);
        const object = await env.r2.get(fileName);
        
        if (!object) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'File not found' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Return file content
        return new Response(object.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Length': object.size.toString(),
          }
        });
      }

      // ==================== HEALTH CHECK ====================
      if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'R2 API is running',
          timestamp: new Date().toISOString(),
          r2_public_url: R2_PUBLIC_URL
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Route không tồn tại
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Route not found',
        availableRoutes: [
          'POST /upload',
          'GET /files', 
          'DELETE /delete/{filename}',
          'GET /file/{filename}',
          'GET /health'
        ]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Error:', error);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
} satisfies ExportedHandler<Env>;
