import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _service: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS — server only, use after authorisation checks. */
export function serviceClient(): SupabaseClient {
  if (!_service) {
    _service = createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _service;
}

/** Anonymous client without cookies (safe inside 'use cache'). RLS applies. */
export function publicClient(): SupabaseClient {
  if (!_public) {
    _public = createClient(url(), anon(), { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return _public;
}

/** Cookie-bound client for Supabase Auth (admin login / session). */
export async function authClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component — the proxy refreshes the session instead
        }
      },
    },
  });
}
