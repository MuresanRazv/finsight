import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("finsight_session")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  
  // Exclude API routes and static files from the check to avoid loops or breaking assets
  const isApiOrStatic = pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes("favicon.ico");

  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // If the user is trying to access dashboard routes (non-auth) without the cookie
  if (!isAuthPage && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If a logged-in user tries to access /login or /register
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
