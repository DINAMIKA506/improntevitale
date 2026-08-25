const { json, clientIp, bodyObject } = require("../_supabase");
const { isAllowedEmail, sameOrigin, authRequest, requireAdmin, setSessionCookies, clearSessionCookies } = require("../_admin");

const attempts = globalThis.__impronteAdminLoginAttempts || new Map();
globalThis.__impronteAdminLoginAttempts = attempts;

function loginLimited(ip) {
  const now = Date.now();
  const active = (attempts.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000);
  active.push(now);
  attempts.set(ip, active);
  return active.length > 8;
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { user } = await requireAdmin(req, res);
      return json(res, 200, { authenticated: true, email: user.email });
    } catch (_) {
      return json(res, 401, { authenticated: false });
    }
  }

  if (req.method === "POST") {
    if (!sameOrigin(req)) return json(res, 403, { message: "Solicitud no permitida." });
    if (loginLimited(clientIp(req))) return json(res, 429, { message: "Demasiados intentos. Esperá 15 minutos." });
    const body = bodyObject(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!isAllowedEmail(email) || password.length < 8) return json(res, 401, { message: "Correo o contraseña incorrectos." });
    try {
      const session = await authRequest("token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (!isAllowedEmail(session.user?.email)) {
        return json(res, 403, { message: "Esta cuenta no tiene acceso al CRM." });
      }
      setSessionCookies(req, res, session);
      attempts.delete(clientIp(req));
      return json(res, 200, { authenticated: true, email: session.user.email });
    } catch (error) {
      console.error("[admin/auth] Supabase rechazó el inicio de sesión", {
        statusCode: Number(error?.statusCode || 0),
        message: String(error?.message || "Error desconocido").slice(0, 180)
      });
      return json(res, 401, { message: "Correo o contraseña incorrectos." });
    }
  }

  if (req.method === "DELETE") {
    if (!sameOrigin(req)) return json(res, 403, { message: "Solicitud no permitida." });
    try {
      const { accessToken } = await requireAdmin(req, res);
      await authRequest("logout", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (_) {}
    clearSessionCookies(req, res);
    return json(res, 200, { authenticated: false });
  }

  return json(res, 405, { message: "Método no permitido." });
};
