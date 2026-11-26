import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEMO_COOKIE, verifyDemoSession } from "@/lib/admin/session-edge";

/**
 * First line of defence for /admin: no session → login page.
 * Pages and server actions still verify the user is in the `admins` table.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const toLogin = () => {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(login);
  };

  if (!url || !anon || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return verifyDemoSession(request.cookies.get(DEMO_COOKIE)?.value) ? NextResponse.next() : toLogin();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return toLogin();
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
