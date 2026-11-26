// Re-export for proxy.ts (which cannot import "server-only" modules).
import { createHmac, timingSafeEqual } from "node:crypto";

export const DEMO_COOKIE = "tz_admin";

export function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.DEMO_ADMIN_PASSWORD || "tanzaib-dev-session-secret";
}

export function verifyDemoSession(value: string | undefined): boolean {
  if (!value || !value.includes(".")) return false;
  const secret = sessionSecret();
  const [payload, sig] = value.split(".");
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return data.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
