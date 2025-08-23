export interface Env {
  DB: D1Database;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // CORS cho frontend gọi
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}

export default {
  async fetch(request: Request, env: Env) {
    // handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/test-db") {
      const { results } = await env.DB.prepare(
        "SELECT MaNguoiDung, HoTen, Email FROM NguoiDung LIMIT 5;"
      ).all();
      return json({ ok: true, data: results });
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
