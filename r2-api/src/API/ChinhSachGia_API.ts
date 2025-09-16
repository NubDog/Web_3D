interface Env {
    DB: D1Database;
}

const ALL_COLUMNS = [
    'chinh_sach_id',
    'ten_chinh_sach',
    'gia_co_ban',
    'tien_coc_mac_dinh',
    'phi_phat_co_ban',
    'ty_le_giam',
    'ngay_tao',
    'ngay_cap_nhat'
]

const jsonResponse = (data: any, status = 200, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(JSON.stringify(data, null, 2), { status, headers: { ...defaultHeaders, ...headers } });
};

export async function handleGetChinhSachGia(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const fieldsParam = url.searchParams.get('fields');

    let columnsToSelect = '*';

    if (fieldsParam) {
        const requestedFields = fieldsParam.split(',').map(f => f.trim());

        const validFields = requestedFields.filter(field => ALL_COLUMNS.includes(field));
        
        if (validFields.length > 0) {
            columnsToSelect = validFields.join(', ');
        } else {
            return jsonResponse({
                success: false,
                error: "Các cột bạn yêu cầu không hợp lệ. Các cột hợp lệ là: " + ALL_COLUMNS.join(', '),
            }, 400);
        }
    }

    const query = `SELECT ${columnsToSelect} FROM ChinhSachGia`;

    try {
        const { results } = await env.DB.prepare(query).all();
        return jsonResponse({
            success: true,
            data: results,
        });
    }
    } catch (e: any) {
        return jsonResponse({
            success: false,
            error: 'Lỗi truy vấn cơ sở dữ liệu.',
            details: e.message,
        }, 500);
    }
}
}