import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/manifesto",
  "/login",
  "/signup",
  "/forgot-password",
  "/legal/cgu",
  "/legal/privacy",
  "/legal/contests-rules",
  "/legal/disclaimer-medical",
];

const PUBLIC_PREFIXES = [
  "/api/",
  "/auth/callback",
  "/_next/",
  "/legal/",
  "/i/",
  "/r/",
  "/go/",
];

const STATIC_FILE = /\.(svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff2?|ttf|otf|mp3|mp4|webm)$/i;

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_FILE.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);

  // Authenticated user landing on /login or /signup → redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Public routes pass through
  if (isPublic(pathname)) return supabaseResponse;

  // Private route without user → /login?next=
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff2?|ttf|otf|mp3|mp4|webm)).*)"],
};
