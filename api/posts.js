const { supabaseRequest, json, validSlug } = require("./_supabase");

function bodyToBlocks(body) {
  return String(body || "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph) => {
    let style = "normal";
    let content = paragraph;
    if (paragraph.startsWith("### ")) { style = "h3"; content = paragraph.slice(4); }
    else if (paragraph.startsWith("## ")) { style = "h2"; content = paragraph.slice(3); }
    else if (paragraph.startsWith("> ")) { style = "blockquote"; content = paragraph.slice(2); }
    return { _type: "block", style, children: [{ _type: "span", text: content }] };
  });
}

function publicPost(row, detail = false) {
  const result = {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    category: row.category,
    publishedAt: row.published_at,
    readTime: row.read_time,
    image: row.image_url,
    imageAlt: row.image_alt
  };
  if (detail) result.body = bodyToBlocks(row.body);
  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { message: "Método no permitido." });
  const slug = String(req.query?.slug || "");
  if (slug && !validSlug(slug)) return json(res, 400, { message: "Artículo no válido." });
  try {
    const select = "title,slug,excerpt,category,published_at,read_time,image_url,image_alt,body";
    if (slug) {
      const rows = await supabaseRequest(`blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=${select}&limit=1`, { method: "GET" });
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
      return json(res, 200, { result: rows[0] ? publicPost(rows[0], true) : null });
    }
    const rows = await supabaseRequest(`blog_posts?status=eq.published&select=${select}&order=published_at.desc&limit=50`, { method: "GET" });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return json(res, 200, { result: (rows || []).map((row) => publicPost(row)) });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: "El blog todavía no está conectado al CRM." });
  }
};
