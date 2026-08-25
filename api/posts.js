const { json } = require("./_supabase");

const API_VERSION = "2026-08-01";

function config() {
  const projectId = process.env.SANITY_PROJECT_ID || "";
  const dataset = process.env.SANITY_DATASET || "production";
  return projectId ? { projectId, dataset } : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { message: "Método no permitido." });
  const sanity = config();
  if (!sanity) return json(res, 503, { message: "El gestor de publicaciones todavía no está conectado." });
  const slug = String(req.query?.slug || "");
  if (slug && !/^[a-z0-9-]{3,100}$/.test(slug)) return json(res, 400, { message: "Artículo no válido." });
  const listQuery = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...30]{title,"slug":slug.current,excerpt,category,publishedAt,readTime,"image":mainImage.asset->url,"imageAlt":mainImage.alt}`;
  const detailQuery = `*[_type == "post" && slug.current == $slug][0]{title,"slug":slug.current,excerpt,category,publishedAt,readTime,"image":mainImage.asset->url,"imageAlt":mainImage.alt,body[]{..., _type == "image" => {"url":asset->url,alt}}}`;
  const params = new URLSearchParams({ query: slug ? detailQuery : listQuery });
  if (slug) params.set("$slug", JSON.stringify(slug));
  const url = `https://${sanity.projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${sanity.dataset}?${params}`;
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Sanity request failed");
    const payload = await response.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return json(res, 200, { result: payload.result });
  } catch (_) {
    return json(res, 502, { message: "No fue posible cargar las publicaciones." });
  }
};
