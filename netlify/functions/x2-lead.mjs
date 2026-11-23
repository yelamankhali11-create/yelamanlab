// Public endpoint: the 2x2 site form saves each request here (in addition to opening WhatsApp).
import { leads, sys, json, ipKey, clean, sameOrigin, readBody, FORMATS, TIMES } from "../lib/x2.mjs";

const PER_HOUR = 8;

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  if (!sameOrigin(req)) return json({ ok: false, error: "origin" }, 403);

  let b;
  try {
    b = await readBody(req);
  } catch {
    return json({ ok: false, error: "bad body" }, 400);
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (b.website) return json({ ok: true });

  const lead = {
    fmt: FORMATS.includes(b.fmt) ? b.fmt : "group",
    kid: clean(b.kid, 60),
    age: Math.max(0, Math.min(99, parseInt(b.age, 10) || 0)),
    time: TIMES.includes(b.time) ? b.time : "",
    parent: clean(b.parent, 60),
    phone: String(b.phone ?? "").replace(/[^\d+]/g, "").slice(0, 16),
    lang: b.lang === "kk" ? "kk" : "ru",
  };
  if (!lead.kid || !lead.parent || lead.phone.replace(/\D/g, "").length < 10 || lead.age < 3)
    return json({ ok: false, error: "invalid" }, 400);

  // Rate limit per visitor IP (hashed, never stored raw).
  const ip = ipKey(context, req);
  const hour = new Date().toISOString().slice(0, 13);
  const rlKey = `rl/${hour}/${ip}`;
  const s = sys();
  const n = (await s.get(rlKey, { type: "json" })) || 0;
  if (n >= PER_HOUR) return json({ ok: false, error: "rate" }, 429);
  await s.setJSON(rlKey, n + 1);

  const now = new Date();
  const id = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  await leads().setJSON(id, { id, ...lead, status: "new", note: "", created: now.toISOString(), updated: now.toISOString() });
  return json({ ok: true });
};

export const config = { path: "/api/2x2/lead" };
