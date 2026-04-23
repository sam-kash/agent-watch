import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback", "/api/ingest", "/api/stripe/webhook", "/api/health"];
const PROTECTED_PATHS = ["/dashboard", "/sessions", "/agents", "/alerts", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // ── Rate limiting on ingest ──────────────────────────────────────────────
  // Handled in the route itself via Redis — middleware just passes through

  // ── Auth check for dashboard + API routes ─────────────────────────────
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — required for Server Components to pick it up
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users hitting dashboard pages
  if (!user && PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect unauthenticated users hitting API routes (except public ones)
  if (!user && pathname.startsWith("/api/") && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect already-authenticated users away from login/signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match everything except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
