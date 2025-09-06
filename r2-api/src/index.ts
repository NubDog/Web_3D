/**
 * R2 API Worker for handling file operations and database
 */

interface Env {
  r2: R2Bucket;
  DB: D1Database;
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
      // ==================== TEST DATABASE ====================
      if (path === '/test-db' && request.method === 'GET') {
        console.log('Testing database connection...');
        
        try {
          const result = await env.DB.prepare('SELECT * FROM ChiNhanh LIMIT 5').all();
          
          return new Response(JSON.stringify({ 
            success: true,
            message: 'Database connection successful',
            data: result.results,
            count: result.results.length,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          return new Response(JSON.stringify({ 
            success: false,
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // ==================== GET CHI NHANH ====================
      if (path === '/chi-nhanh' && request.method === 'GET') {
        console.log('Fetching chi nhanh data...');
        
        try {
          const result = await env.DB.prepare('SELECT * FROM ChiNhanh').all();
          
          return new Response(JSON.stringify({ 
            success: true,
            data: result.results,
            count: result.results.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          return new Response(JSON.stringify({ 
            success: false,
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // ==================== GET LOAI XE ====================  
      if (path === '/loai-xe' && request.method === 'GET') {
        console.log('Fetching loai xe data...');
        
        try {
          const result = await env.DB.prepare('SELECT * FROM LoaiXe').all();
          
          return new Response(JSON.stringify({ 
            success: true,
            data: result.results,
            count: result.results.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          return new Response(JSON.stringify({ 
            success: false,
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // ==================== GET PHUONG TIEN ====================
      if (path === '/phuong-tien' && request.method === 'GET') {
        console.log('Fetching phuong tien data...');
        
        try {
          const result = await env.DB.prepare(`
            SELECT p.*, l.TenLoaiXe, c.TenChiNhanh 
            FROM PhuongTien p 
            JOIN LoaiXe l ON p.MaLoaiXe = l.MaLoaiXe 
            JOIN ChiNhanh c ON p.MaChiNhanh = c.MaChiNhanh
          `).all();
          
          return new Response(JSON.stringify({ 
            success: true,
            data: result.results,
            count: result.results.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          return new Response(JSON.stringify({ 
            success: false,
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // ==================== GET NGUOI DUNG ====================
      if (path === '/nguoi-dung' && request.method === 'GET') {
        console.log('Fetching nguoi dung data...');
        
        try {
          const result = await env.DB.prepare(`
            SELECT MaNguoiDung, HoTen, Email, SoDienThoai, VaiTro, NgayTao 
            FROM NguoiDung
          `).all();
          
          return new Response(JSON.stringify({ 
            success: true,
            data: result.results,
            count: result.results.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          return new Response(JSON.stringify({ 
            success: false,
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // ==================== GET DON THUE ====================
      if (path === '/don-thue' && request.method === 'GET') {
        console.log('Fetching don thue data...');
        
        try {
          const result = await env.DB.prepare(`
            SELECT d.*, n.HoTen as TenKhachHang, p.TenXe, p.BienSo,
                   cn1.TenChiNhanh as ChiNhanhNhan, cn2.TenChiNhanh as ChiNhanhTra
            FROM DonThue d
            JOIN NguoiDung n ON d.MaNguoiDung = n.MaNguoiDung
            JOIN PhuongTien p ON d.MaXe = p.MaXe
            JOIN ChiNhanh cn1 ON d.MaChiNhanhNhan = cn1.MaChiNhanh
            JOIN ChiNhanh cn2 ON d.MaChiNhanhTra = cn2.MaChiNhanh
          `).all();
          
          return new Response(JSON.stringify({ 
            success: true,
            data: result.results,
            count: result.results.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          return new Response(JSON.stringify({ 
            success: false,
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // ==================== UPLOAD FILE ====================
      if (path === '/upload' && request.method === 'POST') {
        console.log('Processing file upload...');
        
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
        
        console.log(`Uploading file: ${fileName}, Size: ${file.size} bytes`);

        // Upload to R2
        await env.r2.put(fileName, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });

        const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

        console.log(`Upload successful: ${fileName}`);

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
        console.log('Fetching files list...');
        
        const objects = await env.r2.list();
        const files = objects.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          url: `${R2_PUBLIC_URL}/${obj.key}`
        }));

        console.log(`Found ${files.length} files`);

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

        console.log(`Deleting file: ${fileName}`);

        await env.r2.delete(fileName);

        console.log(`Delete successful: ${fileName}`);

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
          'GET /test-db - Test database connection',
          'GET /chi-nhanh - Get all branches',
          'GET /loai-xe - Get all vehicle types', 
          'GET /phuong-tien - Get all vehicles with details',
          'GET /nguoi-dung - Get all users (without passwords)',
          'GET /don-thue - Get all rental orders with details',
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
      console.error('Error:', error);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
} satisfies ExportedHandler<Env>;
