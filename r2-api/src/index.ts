/**
 * R2 API Worker for handling file operations and database
 */

// Define the environment variables we expect from wrangler.jsonc
interface Env {
  // Binding for Cloudflare R2 Storage
  r2: R2Bucket;
  // Binding for Cloudflare D1 Database.
  // TÊN NÀY PHẢI KHỚP VỚI "binding" TRONG wrangler.jsonc
  rental_db: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers to allow requests from your frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Router
      switch (path) {
        case '/health':
          if (request.method === 'GET') {
            return new Response(JSON.stringify({ success: true, message: 'API is running' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          break;

        // ==================== GET NGUOI DUNG ====================
        case '/nguoi-dung':
          if (request.method === 'GET') {
            console.log('Fetching nguoi dung data...');
            
            // SỬA LỖI: Dùng env.rental_db thay vì env.DB
            const stmt = env.rental_db.prepare(
              'SELECT * FROM NguoiDung'
            );
            const { results } = await stmt.all();
            
            return new Response(JSON.stringify({
              success: true,
              data: results,
              count: results?.length || 0,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          break;
        
        // You can add other routes here later, e.g. /upload, /files etc.
      }
      
      // If no route was matched
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Route not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
} satisfies ExportedHandler<Env>;
