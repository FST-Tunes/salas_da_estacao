import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on each request and protects the
 * /admin area. If Supabase is not configured (offline demo), it is a no-op so
 * the public UI still renders. Runs on the Node runtime (not Edge) for
 * portability.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  // Offline demo: protect /admin behind a lightweight demo-auth cookie.
  if (!url || !anon) {
    const path = request.nextUrl.pathname;
    const isAdminArea = path.startsWith("/admin") && path !== "/admin/login";
    const hasDemo = request.cookies.get("demo-auth")?.value === "1";
    if (isAdminArea && !hasDemo) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin") && path !== "/admin/login";

  if (isAdminArea && !user) {
    const redirect = new URL("/admin/login", request.url);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
