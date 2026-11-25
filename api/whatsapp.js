// Serverless proxy for the WhatsApp Cloud API (Vercel: /api/whatsapp).
// The access token lives ONLY here (process.env) and never reaches the browser.
// Also mounted in `vite dev` via vite.config.js so local development works.

const sanitizePhone = (raw) => {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return /^\d{11,15}$/.test(d) ? d : null;
};

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
  }

  const { WHATSAPP_API_VERSION = "v21.0", WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN } = process.env;
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: "WhatsApp env vars are not configured on the server" }));
  }

  // Body may already be parsed (Vercel) or need manual reading (vite middleware).
  let body = req.body;
  if (!body || typeof body !== "object") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try { body = JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { body = {}; }
  }

  let { to, templateName, languageCode = "en", components = [] } = body;
  // TESTING ONLY: until the real *_v1 templates are approved in Meta, route every send through an
  // approved no-variable template (e.g. hello_world / en_US) so the whole pipeline can be verified.
  if (process.env.WHATSAPP_TEST_TEMPLATE) {
    console.warn(`[WhatsApp] TEST MODE: "${templateName}" sent as "${process.env.WHATSAPP_TEST_TEMPLATE}"`);
    templateName = process.env.WHATSAPP_TEST_TEMPLATE;
    languageCode = process.env.WHATSAPP_TEST_LANGUAGE || "en_US";
    components = [];
  }
  const phone = sanitizePhone(to);
  if (!phone || !templateName) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: !phone ? "Invalid phone number" : "templateName is required" }));
  }

  try {
    const r = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "template",
          template: { name: templateName, language: { code: languageCode }, components },
        }),
      }
    );
    const data = await r.json().catch(() => ({}));
    res.statusCode = r.ok ? 200 : r.status;
    return res.end(JSON.stringify({ ok: r.ok, data }));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ ok: false, error: `Upstream request failed: ${e.message}` }));
  }
}
