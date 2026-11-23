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
