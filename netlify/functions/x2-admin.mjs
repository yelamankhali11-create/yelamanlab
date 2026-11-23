// Admin endpoint for the 2x2 school: password login -> session token -> list/update/delete leads.
import { leads, sys, site, json, ipKey, clean, sameOrigin, readBody, checkPassword, newToken, sha, STATUSES, PHOTO_KEYS, sanitizeContent, imageType } from "../lib/x2.mjs";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

async function login(req, context, pw) {
  const s = sys();
  const key = `lf/${ipKey(context, req)}`;
  const f = (await s.get(key, { type: "json" })) || { n: 0, until: 0 };
  if (f.until > Date.now()) return json({ ok: false, error: "locked", wait: Math.ceil((f.until - Date.now()) / 60000) }, 429);
  if (!checkPassword(pw)) {
    const n = f.n + 1;
    await s.setJSON(key, n >= MAX_FAILS ? { n: 0, until: Date.now() + LOCK_MS } : { n, until: 0 });
    return json({ ok: false, error: "wrong", left: Math.max(0, MAX_FAILS - n) }, 401);
  }
  await s.delete(key);
  const token = newToken();
  await s.setJSON(`ss/${sha(token)}`, { exp: Date.now() + SESSION_MS });
  return json({ ok: true, token });
}

async function authed(token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return false;
  const sess = await sys().get(`ss/${sha(token)}`, { type: "json" });
  return !!sess && sess.exp > Date.now();
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  if (!sameOrigin(req)) return json({ ok: false, error: "origin" }, 403);
  let b;
  try {
    b = await readBody(req, 900000);
  } catch {
    return json({ ok: false, error: "bad body" }, 400);
  }

  if (b.action === "login") return login(req, context, b.password);
  if (!(await authed(b.token))) return json({ ok: false, error: "auth" }, 401);

  const store = leads();
  if (b.action === "logout") {
    await sys().delete(`ss/${sha(b.token)}`);
    return json({ ok: true });
  }
  if (b.action === "list") {
    const { blobs } = await store.list();
    const items = (await Promise.all(blobs.map((x) => store.get(x.key, { type: "json" })))).filter(Boolean);
    items.sort((a, z) => (a.created < z.created ? 1 : -1));
    return json({ ok: true, items });
  }
  // --- Site content editing ---
  if (b.action === "saveContent") {
    const s = site();
    const cur = (await s.get("content", { type: "json" })) || {};
    const next = { ...sanitizeContent(b.content), photos: cur.photos || {}, updated: new Date().toISOString() };
    if (JSON.stringify(next).length > 200000) return json({ ok: false, error: "too large" }, 413);
    await s.setJSON("content", next);
    return json({ ok: true, content: next });
  }
  if (b.action === "photo" || b.action === "photoReset" || b.action === "photoNone") {
    if (!PHOTO_KEYS.includes(b.key)) return json({ ok: false, error: "key" }, 400);
    const s = site();
    const cur = (await s.get("content", { type: "json" })) || {};
    cur.photos = cur.photos || {};
    if (b.action === "photo") {
      const buf = Buffer.from(String(b.data || ""), "base64");
      const type = imageType(buf);
      if (!type) return json({ ok: false, error: "image" }, 400);
      await s.set(`photo-${b.key}`, buf, { metadata: { type } });
      cur.photos[b.key] = `/api/2x2/photo?k=${b.key}&v=${Date.now()}`;
    } else {
      await s.delete(`photo-${b.key}`);
      if (b.action === "photoNone") cur.photos[b.key] = "";
      else delete cur.photos[b.key];
    }
    cur.updated = new Date().toISOString();
    await s.setJSON("content", cur);
    return json({ ok: true, content: cur });
  }

  const id = typeof b.id === "string" && /^\d{10,16}-[a-z0-9]{1,10}$/.test(b.id) ? b.id : null;
  if (!id) return json({ ok: false, error: "id" }, 400);
  if (b.action === "update") {
    const cur = await store.get(id, { type: "json" });
    if (!cur) return json({ ok: false, error: "not found" }, 404);
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return json({ ok: false, error: "status" }, 400);
      cur.status = b.status;
    }
    if (b.note !== undefined) cur.note = String(b.note).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").slice(0, 1000);
    cur.updated = new Date().toISOString();
    await store.setJSON(id, cur);
    return json({ ok: true, item: cur });
  }
  if (b.action === "delete") {
    await store.delete(id);
    return json({ ok: true });
  }
  return json({ ok: false, error: "action" }, 400);
};

export const config = { path: "/api/2x2/admin" };
