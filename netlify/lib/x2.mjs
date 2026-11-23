// Shared helpers for the 2x2 school site backend (leads + admin panel).
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Admin password is never stored in the repo — only its scrypt hash.
const PW_SALT = "ad62dde330c8c97810cfb4015dfc25ea";
const PW_HASH = "adbf0587850f3eacf4679164d7918760314d6a4b9daa0214282cacefc6d3bc29";

export const STATUSES = ["new", "contacted", "booked", "studying", "declined"];
export const FORMATS = ["group", "pair", "ind"];
export const TIMES = ["am", "pm", "eve"];

export const leads = () => getStore({ name: "x2-leads", consistency: "strong" });
export const sys = () => getStore({ name: "x2-sys", consistency: "strong" });
export const site = () => getStore({ name: "x2-site", consistency: "strong" });

export const PHOTO_KEYS = ["t1", "t2"];
const str = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").slice(0, max) : "");

// Validate admin-edited site content. Everything is rendered with textContent / escaped on the page.
export function sanitizeContent(c) {
  const out = { text: {}, groups: null };
  const text = c && typeof c.text === "object" && c.text ? c.text : {};
  for (const [k, v] of Object.entries(text).slice(0, 400)) {
    if (!/^[A-Za-z0-9]{1,24}$/.test(k) || !v || typeof v !== "object") continue;
    out.text[k] = { ru: str(v.ru, 1500), kk: str(v.kk, 1500) };
  }
  if (Array.isArray(c?.groups)) {
    const pair = (o) => ({ ru: str(o?.ru, 160), kk: str(o?.kk, 160) });
    out.groups = c.groups.slice(0, 30).map((g) => ({ a: pair(g?.a), t: pair(g?.t), d: pair(g?.d) })).filter((g) => g.a.ru || g.t.ru);
  }
  return out;
}

// Accept only real JPEG / PNG / WebP images up to 600 KB.
export function imageType(buf) {
  if (buf.length < 12 || buf.length > 600 * 1024) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export const sha = (s) => createHash("sha256").update(String(s)).digest("hex");
export const ipKey = (context, req) =>
  sha("x2|" + (context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown")).slice(0, 24);

export function checkPassword(pw) {
  if (typeof pw !== "string" || pw.length < 6 || pw.length > 200) return false;
  const got = scryptSync(pw, PW_SALT, 32);
  return timingSafeEqual(got, Buffer.from(PW_HASH, "hex"));
}

export const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export const newToken = () => randomBytes(32).toString("hex");

// Same-origin guard for browser POSTs (blocks other sites from posting on a visitor's behalf).
export function sameOrigin(req) {
  const o = req.headers.get("origin");
  if (!o) return true;
  try {
    return new URL(o).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function readBody(req, limit = 4000) {
  const text = await req.text();
  if (text.length > limit) throw new Error("too large");
  return JSON.parse(text || "{}");
}
