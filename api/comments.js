const { supabaseRequest, json, clientIp, bodyObject } = require("./_supabase");

const attempts = globalThis.__impronteCommentAttempts || new Map();
globalThis.__impronteCommentAttempts = attempts;

function limited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const active = (attempts.get(ip) || []).filter((time) => now - time < windowMs);
  active.push(now);
  attempts.set(ip, active);
  return active.length > 4;
}

function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9-]{3,100}$/.test(value);
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const slug = String(req.query?.slug || "");
    if (!validSlug(slug)) return json(res, 400, { message: "Artículo no válido." });
    try {
      const path = `blog_comments?post_slug=eq.${encodeURIComponent(slug)}&status=eq.approved&select=id,author_name,body,created_at&order=created_at.desc&limit=50`;
      const comments = await supabaseRequest(path, { method: "GET" });
      return json(res, 200, { comments: comments || [] });
    } catch (error) {
      return json(res, error.statusCode || 500, { message: error.message || "No fue posible cargar los comentarios." });
    }
  }

  if (req.method === "POST") {
    if (limited(clientIp(req))) return json(res, 429, { message: "Demasiados comentarios seguidos. Esperá unos minutos." });
    const body = bodyObject(req);
    if (body.website) return json(res, 202, { ok: true });
    const slug = String(body.slug || "");
    const name = String(body.name || "").trim().slice(0, 80);
    const comment = String(body.body || "").trim().slice(0, 1200);
    if (!validSlug(slug) || name.length < 2 || comment.length < 2) return json(res, 400, { message: "Escribí tu nombre y un comentario válido." });
    try {
      await supabaseRequest("blog_comments", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ post_slug: slug, author_name: name, body: comment, status: "pending" })
      });
      return json(res, 201, { ok: true, message: "¡Gracias! Tu comentario quedó pendiente de aprobación." });
    } catch (error) {
      return json(res, error.statusCode || 500, { message: error.message || "No fue posible enviar el comentario." });
    }
  }

  return json(res, 405, { message: "Método no permitido." });
};
