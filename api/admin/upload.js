const { randomUUID } = require("crypto");
const { getConfig, apiKeyHeaders, json, bodyObject } = require("../_supabase");
const { requireAdmin, sameOrigin } = require("../_admin");

const types = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Método no permitido." });
  try {
    await requireAdmin(req, res);
    if (!sameOrigin(req)) return json(res, 403, { message: "Solicitud no permitida." });
    const config = getConfig();
    if (!config) return json(res, 503, { message: "Supabase no está configurado." });
    const body = bodyObject(req);
    const mime = String(body.type || "");
    const extension = types[mime];
    const base64 = String(body.data || "").replace(/^data:[^;]+;base64,/, "");
    if (!extension || !base64) return json(res, 400, { message: "Seleccioná una imagen JPG, PNG, WEBP o AVIF." });
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length || buffer.length > 4 * 1024 * 1024) return json(res, 413, { message: "La imagen debe pesar menos de 4 MB." });
    const objectPath = `blog/${Date.now()}-${randomUUID()}.${extension}`;
    const response = await fetch(`${config.url}/storage/v1/object/blog-images/${objectPath}`, {
      method: "POST",
      headers: {
        ...apiKeyHeaders(config.serviceKey),
        "Content-Type": mime,
        "x-upsert": "false"
      },
      body: buffer
    });
    if (!response.ok) {
      console.error("Supabase upload failed", response.status, (await response.text()).slice(0, 300));
      return json(res, 502, { message: "No fue posible subir la imagen. Revisá que el SQL del CRM esté ejecutado." });
    }
    return json(res, 201, { url: `${config.url}/storage/v1/object/public/blog-images/${objectPath}` });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: error.message || "No fue posible subir la imagen." });
  }
};
