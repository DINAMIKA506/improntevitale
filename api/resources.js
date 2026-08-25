const { supabaseRequest, json, validSlug } = require("./_supabase");

function publicResource(row) {
  return {
    ...(row.config || {}),
    id: row.id,
    kicker: row.kicker,
    title: row.title,
    description: row.description,
    duration: row.duration,
    note: row.note,
    enabled: row.enabled,
    sortOrder: row.sort_order
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { message: "Método no permitido." });
  const id = String(req.query?.id || "");
  if (id && !validSlug(id)) return json(res, 400, { message: "Recurso no válido." });
  try {
    const select = "id,kicker,title,description,duration,note,config,enabled,sort_order";
    if (id) {
      const rows = await supabaseRequest(`resources?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`, { method: "GET" });
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
      if (rows[0] && rows[0].enabled === false) return json(res, 410, { result: null, disabled: true });
      return json(res, rows[0] ? 200 : 404, { result: rows[0] ? publicResource(rows[0]) : null });
    }
    const rows = await supabaseRequest(`resources?enabled=eq.true&select=${select}&order=sort_order.asc`, { method: "GET" });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return json(res, 200, { result: (rows || []).map(publicResource) });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: "Los recursos todavía no están conectados al CRM." });
  }
};
