// Public, read-only: site content edited in the 2x2 admin panel, and teacher photos.
import { site, json, PHOTO_KEYS } from "../lib/x2.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({ ok: false, error: "method" }, 405);
  const url = new URL(req.url);
  if (url.pathname.endsWith("/photo")) {
    const k = url.searchParams.get("k");
    if (!PHOTO_KEYS.includes(k)) return new Response("not found", { status: 404 });
    const r = await site().getWithMetadata(`photo-${k}`, { type: "arrayBuffer" });
    if (!r) return new Response("not found", { status: 404 });
    return new Response(r.data, {
      headers: {
        "Content-Type": r.metadata?.type || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  const content = (await site().get("content", { type: "json" })) || {};
  return new Response(JSON.stringify({ ok: true, content }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
};

export const config = { path: ["/api/2x2/content", "/api/2x2/photo"] };
