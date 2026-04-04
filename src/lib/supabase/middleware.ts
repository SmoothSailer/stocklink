import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require regular auth (ordering & affiliate)
const PROTECTED_ROUTES = ["/orders", "/affiliate/dashboard"];

// Admin emails allowed to access /admin
const ADMIN_EMAILS = [
  "admin@stocklink.co",
  "farhan@stocklink.co",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── Admin routes ───
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  if (isAdminRoute) {
    // Not signed in → admin login
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
    // Signed in but not an admin → forbidden
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated admin away from admin login page
  if (pathname === "/admin/login" && user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/inventory";
    return NextResponse.redirect(adminUrl);
  }

  // ─── Regular protected routes ───
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If signed in and trying to access login page → redirect to home
  if (user && pathname.startsWith("/login")) {
    const next = request.nextUrl.searchParams.get("next") ?? "/";
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = next;
    homeUrl.searchParams.delete("next");
    return NextResponse.redirect(homeUrl);
  }

  // ─── Security headers ───
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return supabaseResponse;
}
