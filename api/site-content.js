const { supabaseRequest, json } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { message: "Método no permitido." });
  try {
    const rows = await supabaseRequest("site_content?key=eq.homepage&select=value&limit=1", { method: "GET" });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return json(res, 200, { result: rows[0]?.value || null });
  } catch (_) {
    return json(res, 200, { result: null });
  }
};
