import { NextResponse } from "next/server";
import type { AuthContext } from "./app-auth";

export function isDevAuthAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function devAuthBlockedResponse() {
  return NextResponse.json({ ok: false, error: "Not available" }, { status: 404 });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function apiSuccess<T extends Record<string, unknown>>(data: T) {
  return NextResponse.json({ ok: true, ...data });
}

export function requireDbUser(ctx: AuthContext | null): NextResponse | null {
  if (!ctx) return apiError("Unauthorized", 401);
  if (!ctx.dbUser) {
    return apiError("מצב דמו — חברו את המערכת להפעלה אמיתית", 403);
  }
  return null;
}

export function isSafeRedirectPath(path: string): boolean {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  );
}

export { getSessionCookieOptions } from "./session-cookies";

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function isDemoSeedingAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_SEED === "true"
  );
}
