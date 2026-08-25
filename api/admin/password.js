const { json, bodyObject } = require("../_supabase");
const { isAllowedEmail, sameOrigin, authRequest } = require("../_admin");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Método no permitido." });
  if (!sameOrigin(req)) return json(res, 403, { message: "Solicitud no permitida." });
  const body = bodyObject(req);
  const accessToken = String(body.accessToken || "");
  const password = String(body.password || "");
  if (!accessToken || password.length < 12) return json(res, 400, { message: "La contraseña debe tener al menos 12 caracteres." });
  try {
    const user = await authRequest("user", { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!isAllowedEmail(user.email)) return json(res, 403, { message: "Esta invitación no tiene acceso al CRM." });
    await authRequest("user", { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ password }) });
    return json(res, 200, { ok: true, email: user.email });
  } catch (_) {
    return json(res, 401, { message: "La invitación venció o ya fue utilizada. Enviá una nueva desde Supabase." });
  }
};
