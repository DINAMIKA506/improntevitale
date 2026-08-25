const builtinResources = new Set([
  "madurez-vocacional",
  "estilos-aprendizaje",
  "ruta-decision",
  "proyecto-vida",
  "creando-mi-ikigai",
  "ficha-tecnica"
]);

function getConfig() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !serviceKey) return null;
  return { url, serviceKey, anonKey: anonKey || serviceKey };
}

function apiKeyHeaders(key, bearerToken = "") {
  const headers = { apikey: key };
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  else if (!String(key).startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function supabaseRequest(path, options = {}) {
  const config = getConfig();
  if (!config) {
    const error = new Error("El CRM todavía no está conectado en Vercel.");
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...apiKeyHeaders(config.serviceKey),
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase request failed", response.status, detail.slice(0, 500));
    const error = new Error("No fue posible completar la operación en este momento.");
    error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw error;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!res.hasHeader("Cache-Control")) res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function bodyObject(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(value);
}

function cleanJson(value, depth = 0) {
  if (depth > 8) return null;
  if (Array.isArray(value)) return value.slice(0, 250).map((item) => cleanJson(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 300)
        .filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key))
        .map(([key, item]) => [String(key).slice(0, 100), cleanJson(item, depth + 1)])
    );
  }
  if (typeof value === "string") return value.trim().slice(0, 60000);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  return null;
}

async function isAllowedResource(resourceId) {
  if (!validSlug(resourceId)) return false;
  if (builtinResources.has(resourceId)) return true;
  try {
    const rows = await supabaseRequest(`resources?id=eq.${encodeURIComponent(resourceId)}&enabled=eq.true&select=id&limit=1`, { method: "GET" });
    return Array.isArray(rows) && rows.length === 1;
  } catch (_) {
    return false;
  }
}

module.exports = {
  builtinResources,
  getConfig,
  apiKeyHeaders,
  supabaseRequest,
  json,
  clientIp,
  bodyObject,
  validSlug,
  cleanJson,
  isAllowedResource
};
