const defaults = require("../../data/resources.json");
const { supabaseRequest, json, bodyObject, validSlug, cleanJson } = require("../_supabase");
const { requireAdmin, sameOrigin } = require("../_admin");

const editableStatuses = {
  submissions: new Set(["new", "reviewing", "completed", "archived"]),
  leads: new Set(["new", "contacted", "scheduled", "closed", "archived"]),
  comments: new Set(["pending", "approved", "rejected"]),
  posts: new Set(["draft", "published", "archived"])
};

function text(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function boolean(value) {
  return value === true || value === "true";
}

function postRow(body, partial = false) {
  const slug = text(body.slug, 80).toLowerCase();
  const title = text(body.title, 180);
  if (!partial && (!validSlug(slug) || title.length < 3)) throw Object.assign(new Error("Completá un título y una dirección válida."), { statusCode: 400 });
  const row = {};
  const assign = (key, value) => { if (!partial || body[key] !== undefined) row[key] = value; };
  assign("slug", slug);
  assign("title", title);
  assign("excerpt", text(body.excerpt, 600));
  assign("category", text(body.category, 80) || "Impronte");
  assign("published_at", body.published_at ? new Date(body.published_at).toISOString() : new Date().toISOString());
  assign("read_time", text(body.read_time, 40));
  assign("image_url", text(body.image_url, 1000));
  assign("image_alt", text(body.image_alt, 250));
  assign("body", text(body.body, 60000));
  assign("status", editableStatuses.posts.has(body.status) ? body.status : "draft");
  row.updated_at = new Date().toISOString();
  return row;
}

function resourceRow(body) {
  const id = text(body.id, 80).toLowerCase();
  if (!validSlug(id)) throw Object.assign(new Error("La dirección del recurso no es válida."), { statusCode: 400 });
  const config = cleanJson(body.config || {});
  if (!Array.isArray(config?.steps) || !config.steps.length) throw Object.assign(new Error("El recurso necesita al menos una etapa."), { statusCode: 400 });
  return {
    id,
    kicker: text(body.kicker, 100) || "Recurso interactivo",
    title: text(body.title, 180),
    description: text(body.description, 1000),
    duration: text(body.duration, 60),
    note: text(body.note, 1500),
    config,
    enabled: boolean(body.enabled),
    sort_order: Math.max(0, Math.min(999, Number(body.sort_order) || 0)),
    updated_at: new Date().toISOString()
  };
}

function mergeResources(stored) {
  const rows = new Map((stored || []).map((item) => [item.id, item]));
  const merged = Object.entries(defaults).map(([id, fallback], index) => {
    const saved = rows.get(id);
    rows.delete(id);
    if (!saved) {
      const { kicker, title, description, duration, note, ...config } = fallback;
      return { id, kicker, title, description, duration, note, config, enabled: true, sort_order: index + 1, source: "default" };
    }
    const { kicker: _kicker, title: _title, description: _description, duration: _duration, note: _note, ...fallbackConfig } = fallback;
    return { ...saved, config: { ...fallbackConfig, ...(saved.config || {}) }, source: "database" };
  });
  return [...merged, ...Array.from(rows.values()).map((item) => ({ ...item, source: "database" }))]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

async function getEntity(entity) {
  if (entity === "overview") {
    const [submissions, leads, comments, posts] = await Promise.all([
      supabaseRequest("resource_submissions?select=id,resource_id,participant_name,status,created_at&order=created_at.desc&limit=200", { method: "GET" }),
      supabaseRequest("contact_leads?select=id,first_name,last_name,email,status,created_at&order=created_at.desc&limit=200", { method: "GET" }),
      supabaseRequest("blog_comments?select=id,post_slug,author_name,status,created_at&order=created_at.desc&limit=200", { method: "GET" }),
      supabaseRequest("blog_posts?select=id,title,slug,status,updated_at&order=updated_at.desc&limit=200", { method: "GET" })
    ]);
    return {
      counts: {
        submissions: submissions.length,
        leads: leads.length,
        pendingComments: comments.filter((item) => item.status === "pending").length,
        publishedPosts: posts.filter((item) => item.status === "published").length
      },
      recent: { submissions: submissions.slice(0, 5), leads: leads.slice(0, 5), comments: comments.slice(0, 5) }
    };
  }
  if (entity === "submissions") return supabaseRequest("resource_submissions?select=id,resource_id,participant_name,participant_email,answers,status,admin_notes,consented_at,created_at&order=created_at.desc&limit=300", { method: "GET" });
  if (entity === "leads") return supabaseRequest("contact_leads?select=id,first_name,last_name,email,message,status,admin_notes,created_at&order=created_at.desc&limit=300", { method: "GET" });
  if (entity === "comments") return supabaseRequest("blog_comments?select=id,post_slug,author_name,body,status,created_at&order=created_at.desc&limit=300", { method: "GET" });
  if (entity === "posts") return supabaseRequest("blog_posts?select=id,slug,title,excerpt,category,published_at,read_time,image_url,image_alt,body,status,created_at,updated_at&order=updated_at.desc&limit=300", { method: "GET" });
  if (entity === "resources") {
    const stored = await supabaseRequest("resources?select=id,kicker,title,description,duration,note,config,enabled,sort_order,updated_at&order=sort_order.asc", { method: "GET" });
    return mergeResources(stored);
  }
  if (entity === "content") {
    const rows = await supabaseRequest("site_content?key=eq.homepage&select=key,value,updated_at&limit=1", { method: "GET" });
    return rows[0] || { key: "homepage", value: {} };
  }
  throw Object.assign(new Error("Sección no válida."), { statusCode: 400 });
}

async function saveEntity(entity, method, body) {
  if (entity === "posts") {
    if (method === "POST") return supabaseRequest("blog_posts", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(postRow(body)) });
    if (!body.id) throw Object.assign(new Error("Artículo no válido."), { statusCode: 400 });
    return supabaseRequest(`blog_posts?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(postRow(body, true)) });
  }
  if (entity === "resources") {
    const row = resourceRow(body);
    return supabaseRequest("resources?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(row) });
  }
  if (entity === "content") {
    const value = cleanJson(body.value || {});
    return supabaseRequest("site_content?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ key: "homepage", value, updated_at: new Date().toISOString() }) });
  }
  if (!body.id) throw Object.assign(new Error("Registro no válido."), { statusCode: 400 });
  if (entity === "submissions") {
    const status = editableStatuses.submissions.has(body.status) ? body.status : "new";
    return supabaseRequest(`resource_submissions?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, admin_notes: text(body.admin_notes, 5000) }) });
  }
  if (entity === "leads") {
    const status = editableStatuses.leads.has(body.status) ? body.status : "new";
    return supabaseRequest(`contact_leads?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, admin_notes: text(body.admin_notes, 5000) }) });
  }
  if (entity === "comments") {
    const status = editableStatuses.comments.has(body.status) ? body.status : "pending";
    return supabaseRequest(`blog_comments?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status }) });
  }
  throw Object.assign(new Error("Sección no válida."), { statusCode: 400 });
}

async function deleteEntity(entity, id) {
  const tables = { submissions: "resource_submissions", leads: "contact_leads", comments: "blog_comments", posts: "blog_posts", resources: "resources" };
  const table = tables[entity];
  if (!table || !id) throw Object.assign(new Error("Registro no válido."), { statusCode: 400 });
  const column = entity === "resources" ? "id" : "id";
  await supabaseRequest(`${table}?${column}=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return { ok: true };
}

module.exports = async function handler(req, res) {
  try {
    await requireAdmin(req, res);
    const entity = String(req.query?.entity || "overview");
    if (req.method === "GET") return json(res, 200, { result: await getEntity(entity) });
    if (!["POST", "PATCH", "DELETE"].includes(req.method)) return json(res, 405, { message: "Método no permitido." });
    if (!sameOrigin(req)) return json(res, 403, { message: "Solicitud no permitida." });
    const body = bodyObject(req);
    if (req.method === "DELETE") return json(res, 200, { result: await deleteEntity(entity, body.id) });
    return json(res, 200, { result: await saveEntity(entity, req.method, body) });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: error.message || "No fue posible completar la operación." });
  }
};
