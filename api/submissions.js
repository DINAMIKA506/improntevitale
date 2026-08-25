const { isAllowedResource, supabaseRequest, json, clientIp, bodyObject, cleanJson } = require("./_supabase");

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { message: "Método no permitido." });
  if (limited(clientIp(req))) return json(res, 429, { message: "Demasiados intentos. Esperá unos minutos y volvé a intentarlo." });
  const body = bodyObject(req);
  if (body.website) return json(res, 202, { ok: true });
  if (!(await isAllowedResource(body.resourceId)) || body.consent !== true || !body.answers || typeof body.answers !== "object") {
    return json(res, 400, { message: "Revisá la información y la autorización antes de enviar." });
  }
  if (JSON.stringify(body.answers).length > 120000) return json(res, 413, { message: "La respuesta es demasiado extensa." });

  const answers = cleanJson(body.answers);
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
