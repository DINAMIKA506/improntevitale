const { allowedResources, supabaseRequest, json, clientIp } = require("./_supabase");

const attempts = globalThis.__impronteSubmissionAttempts || new Map();
globalThis.__impronteSubmissionAttempts = attempts;

function limited(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const active = (attempts.get(ip) || []).filter((time) => now - time < windowMs);
  active.push(now);
  attempts.set(ip, active);
  return active.length > 8;
}

function cleanAnswers(value, depth = 0) {
  if (depth > 4) return null;
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => cleanAnswers(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).slice(0, 100).filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key)).map(([key, item]) => [key.slice(0, 80), cleanAnswers(item, depth + 1)]));
  }
  if (typeof value === "string") return value.trim().slice(0, 5000);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Método no permitido." });
  if (limited(clientIp(req))) return json(res, 429, { message: "Demasiados intentos. Esperá unos minutos y volvé a intentarlo." });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (body.website) return json(res, 202, { ok: true });
  if (!allowedResources.has(body.resourceId) || body.consent !== true || !body.answers || typeof body.answers !== "object") {
    return json(res, 400, { message: "Revisá la información y la autorización antes de enviar." });
  }
  if (JSON.stringify(body.answers).length > 120000) return json(res, 413, { message: "La respuesta es demasiado extensa." });

  const answers = cleanAnswers(body.answers);
  const row = {
    resource_id: body.resourceId,
    participant_name: String(answers.participant_name || answers.nombre || "").slice(0, 160),
    participant_email: String(answers.participant_email || answers.correo || "").slice(0, 240) || null,
    answers,
    status: "new",
    consented_at: new Date().toISOString()
  };

  try {
    await supabaseRequest("resource_submissions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(row)
    });
    return json(res, 201, { ok: true });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: error.message || "No fue posible completar el envío." });
  }
};
