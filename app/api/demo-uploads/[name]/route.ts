import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDemoMode } from "@/lib/data";
import { DEMO_UPLOAD_DIR } from "@/lib/data/memory";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", avif: "image/avif" };

/** Serves images uploaded in demo mode (no Supabase Storage). */
export async function GET(_req: Request, ctx: RouteContext<"/api/demo-uploads/[name]">) {
  if (!isDemoMode()) return new Response("Not found", { status: 404 });
  const { name } = await ctx.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return new Response("Bad request", { status: 400 });
  try {
    const body = await readFile(join(DEMO_UPLOAD_DIR, name));
    const ext = name.split(".").pop() ?? "";
    return new Response(body, { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
