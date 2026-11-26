import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { authClient } from "@/lib/supabase/clients";
import { db } from "@/lib/data";
import { DEMO_COOKIE, sessionSecret } from "./session-edge";

export interface AdminUser {
  id: string;
  email: string;
  mode: "supabase" | "demo";
}

export { DEMO_COOKIE };
const DEMO_TTL_SECONDS = 60 * 60 * 8;

export function demoAdminEmail() {
  return (process.env.ADMIN_EMAIL || "admin@tanzaib.pk").toLowerCase();
}

/** Demo login is available only without Supabase, and only with a password configured (or in dev). */
export function demoAdminPassword(): string | null {
  if (isSupabaseConfigured()) return null;
  if (process.env.DEMO_ADMIN_PASSWORD) return process.env.DEMO_ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "tanzaib-demo";
}

const secret = sessionSecret;

export function signDemoSession(email: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(now / 1000) + DEMO_TTL_SECONDS })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return { value: `${payload}.${sig}`, maxAge: DEMO_TTL_SECONDS };
}

export function verifyDemoSession(value: string | undefined): { email: string } | null {
  if (!value || !value.includes(".")) return null;
  const [payload, sig] = value.split(".");
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; exp: number };
    if (data.exp * 1000 < Date.now()) return null;
    if (data.email !== demoAdminEmail()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

/** The signed-in admin, or null. Checks the `admins` table — a logged-in non-admin gets null. */
export async function getAdmin(): Promise<AdminUser | null> {
  // Admin data is always per-request — never prerendered.
  await connection();
  if (!isSupabaseConfigured()) {
    if (!demoAdminPassword()) return null;
    const store = await cookies();
    const s = verifyDemoSession(store.get(DEMO_COOKIE)?.value);
    return s ? { id: "demo-admin", email: s.email, mode: "demo" } : null;
  }
  const supabase = await authClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const rows = await db().select("admins", { eq: { user_id: data.user.id } });
  if (!rows.length) return null;
  return { id: data.user.id, email: data.user.email ?? rows[0].email, mode: "supabase" };
}

/** For admin pages: redirect to the login page when not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class NotAuthorisedError extends Error {
  constructor() {
    super("Not authorised");
  }
}

/** For server actions / route handlers: throw when not an admin. */
export async function assertAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) throw new NotAuthorisedError();
  return admin;
}
