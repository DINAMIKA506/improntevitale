const { supabaseRequest, json, clientIp, bodyObject } = require("./_supabase");

const attempts = globalThis.__impronteContactAttempts || new Map();
globalThis.__impronteContactAttempts = attempts;

function limited(ip) {
  const now = Date.now();
  const active = (attempts.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  active.push(now);
  attempts.set(ip, active);
  return active.length > 8;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Método no permitido." });
  if (limited(clientIp(req))) return json(res, 429, { message: "Demasiados intentos. Esperá unos minutos." });
  const body = bodyObject(req);
  if (body.website) return json(res, 202, { ok: true });
  const firstName = String(body.firstName || "").trim().slice(0, 100);
  const lastName = String(body.lastName || "").trim().slice(0, 100);
  const email = String(body.email || "").trim().slice(0, 240);
  const message = String(body.message || "").trim().slice(0, 5000);
  if (firstName.length < 2 || lastName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 5) {
    return json(res, 400, { message: "Revisá el nombre, el correo y el mensaje." });
  }
  try {
    await supabaseRequest("contact_leads", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, message, status: "new" })
    });
    return json(res, 201, { ok: true });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: "No fue posible guardar la consulta." });
  }
};
