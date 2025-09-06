/**
 * Simple D1 Database Worker - CLEAN VERSION
 */

interface Env {
  rental_db: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // ==================== MAIN ENDPOINT: GET BOTH TABLES ====================
      if (path === '/' || path === '/data') {
        console.log('CLEAN VERSION - Fetching PhuongTien and KhachHang data...');
        
        // Get PhuongTien data - sử dụng tên cột đúng theo database
        const phuongTienResult = await env.rental_db.prepare(`
          SELECT 
            phuong_tien_id,
            ten_phuong_tien,
            loai,
            danh_muc_id,
            trang_thai,
            bien_so,
            so_km,
            chinh_sach_id,
            so_khung,
            ngay_tao,
            ngay_cap_nhat
          FROM PhuongTien
        `).all();

        // Get KhachHang data - sử dụng bảng NguoiDung với tên cột đúng
        const khachHangResult = await env.rental_db.prepare(`
          SELECT 
            nguoi_dung_id,
            ten_dang_nhap,
            vai_tro,
            trang_thai,
            ho_ten,
            email,
            so_dien_thoai,
            ngay_tao,
            ngay_cap_nhat
          FROM NguoiDung 
          WHERE vai_tro = 'KhachHang'
        `).all();

        const result = {
          success: true,
          version: 'CLEAN_VERSION_2024_UPDATED',
          message: 'Dữ liệu từ D1 Database - Updated Column Names',
          data: {
            phuongTien: phuongTienResult.results,
            khachHang: khachHangResult.results
          },
          count: {
            phuongTien: phuongTienResult.results.length,
            khachHang: khachHangResult.results.length
          },
          timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(result, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==================== TEST CONNECTION ====================
      if (path === '/test') {
        try {
          // Kiểm tra bảng có tồn tại không
          const tables = await env.rental_db.prepare(`
            SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
          `).all();
          
          // Test query từng bảng
          let testResults = {};
          
          // Test PhuongTien
          try {
            const phuongTienTest = await env.rental_db.prepare('SELECT COUNT(*) as count FROM PhuongTien').all();
            testResults.phuongTien = { count: phuongTienTest.results[0].count, status: 'OK' };
          } catch (error) {
            testResults.phuongTien = { error: error.message, status: 'ERROR' };
          }
          
          // Test NguoiDung
          try {
            const nguoiDungTest = await env.rental_db.prepare('SELECT COUNT(*) as count FROM NguoiDung').all();
            testResults.nguoiDung = { count: nguoiDungTest.results[0].count, status: 'OK' };
          } catch (error) {
            testResults.nguoiDung = { error: error.message, status: 'ERROR' };
          }
          
          return new Response(JSON.stringify({ 
            success: true,
            version: 'CLEAN_VERSION_2024_UPDATED',
            message: 'Database connected - Updated Column Names!',
            tables: tables.results.map(t => t.name),
            tableTests: testResults,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false,
            version: 'CLEAN_VERSION_2024_UPDATED',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Default response
      return new Response(JSON.stringify({ 
        success: false,
        version: 'CLEAN_VERSION_2024_UPDATED',
        error: 'Route not found - Updated Column Names',
        available_endpoints: [
          'GET / hoặc /data - Lấy cả PhuongTien và NguoiDung (KhachHang)',
          'GET /test - Test kết nối database và kiểm tra bảng'
        ]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false,
        version: 'CLEAN_VERSION_2024_UPDATED',
        error: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
} satisfies ExportedHandler<Env>;
