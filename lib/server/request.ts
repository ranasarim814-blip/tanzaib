import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

export async function clientInfo() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
  const salt = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "tanzaib-dev-salt";
  return {
    ipHash: createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32),
    userAgent: (h.get("user-agent") || "").slice(0, 300),
  };
}

/** Best-effort in-memory limiter for low-value endpoints (newsletter, contact, track). */
const buckets = new Map<string, number[]>();
export function softLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}
