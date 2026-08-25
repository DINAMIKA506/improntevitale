const { getConfig } = require("./_supabase");

const ACCESS_COOKIE = "iv_admin_access";
const REFRESH_COOKIE = "iv_admin_refresh";
const DEFAULT_ADMIN_EMAIL = "improntevitale.orx@gmail.com";

function allowedEmail() {
  return Array.from(allowedEmails())[0] || DEFAULT_ADMIN_EMAIL;
}

function allowedEmails() {
  const configured = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");
  const values = (configured || DEFAULT_ADMIN_EMAIL)
    .split(/[,;\n]/)
    .map((email) => String(email).trim().toLowerCase())
    .filter((email) => /^\S+@\S+\.\S+$/.test(email));
  return new Set(values.length ? values : [DEFAULT_ADMIN_EMAIL]);
}

function isAllowedEmail(email) {
  return allowedEmails().has(String(email || "").trim().toLowerCase());
}

function parseCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index < 1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try { cookies[key] = decodeURIComponent(value); } catch (_) { cookies[key] = value; }
    return cookies;
  }, {});
}

function cookieLine(name, value, maxAge, req) {
  const secure = String(req.headers["x-forwarded-proto"] || "").toLowerCase() === "https" || process.env.VERCEL === "1";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function setSessionCookies(req, res, session) {
  const accessAge = Math.max(60, Number(session.expires_in || 3600) - 30);
  res.setHeader("Set-Cookie", [
    cookieLine(ACCESS_COOKIE, session.access_token, accessAge, req),
    cookieLine(REFRESH_COOKIE, session.refresh_token, 60 * 60 * 24 * 7, req)
  ]);
}

function clearSessionCookies(req, res) {
  res.setHeader("Set-Cookie", [
    cookieLine(ACCESS_COOKIE, "", 0, req),
    cookieLine(REFRESH_COOKIE, "", 0, req)
  ]);
}

function sameOrigin(req) {
  const origin = String(req.headers.origin || "");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase();
  if (!origin || !host) return false;
  try { return new URL(origin).host.toLowerCase() === host; } catch (_) { return false; }
}

async function authRequest(path, options = {}) {
  const config = getConfig();
  if (!config) {
    const error = new Error("Supabase no está configurado.");
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error_description || payload.msg || payload.message || "No fue posible iniciar sesión.");
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

async function userFromAccessToken(accessToken) {
  if (!accessToken) return null;
  try {
    return await authRequest("user", { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch (_) {
    return null;
  }
}

async function requireAdmin(req, res) {
  const cookies = parseCookies(req);
  let accessToken = cookies[ACCESS_COOKIE] || "";
  let user = await userFromAccessToken(accessToken);

  if (!user && cookies[REFRESH_COOKIE]) {
    try {
      const session = await authRequest("token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: cookies[REFRESH_COOKIE] })
      });
      accessToken = session.access_token;
      user = session.user || await userFromAccessToken(accessToken);
      setSessionCookies(req, res, session);
    } catch (_) {
      clearSessionCookies(req, res);
    }
  }

  if (!user || !isAllowedEmail(user.email)) {
    const error = new Error("Sesión no autorizada.");
    error.statusCode = 401;
    throw error;
  }
  return { user, accessToken };
}

module.exports = {
  allowedEmail,
  allowedEmails,
  isAllowedEmail,
  sameOrigin,
  authRequest,
  requireAdmin,
  setSessionCookies,
  clearSessionCookies
};
