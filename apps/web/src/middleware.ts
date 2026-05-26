import type { NextRequest, NextFetchEvent } from "next/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { DEV_SESSION_COOKIE } from "@/lib/app-auth";
import { DEMO_SESSION_VALUE } from "@/lib/demo-fallback";
import clerkMiddlewareHandler from "./middleware.clerk";

const DEV_PUBLIC_PREFIXES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/demo",
  "/actions",
  "/api/webhooks",
  "/api/health",
  "/api/dev",
];

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(?:css|js|mjs|map|ico|png|jpe?g|gif|svg|webp|woff2?|ttf|json|webmanifest)$/i.test(
      pathname
    )
  );
}

function isDevPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return DEV_PUBLIC_PREFIXES.filter((p) => p !== "/").some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (!isClerkConfigured()) {
    if (isDevPublicPath(pathname)) {
      return NextResponse.next();
    }
    const session = req.cookies.get(DEV_SESSION_COOKIE)?.value;
    const hasSession = session === "1" || session === DEMO_SESSION_VALUE;
    if (!hasSession) {
      const signUp = new URL("/sign-up", req.url);
      signUp.searchParams.set("next", pathname);
      return NextResponse.redirect(signUp);
    }
    return NextResponse.next();
  }
  return clerkMiddlewareHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
