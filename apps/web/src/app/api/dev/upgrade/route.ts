import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ensureDevUser,
  DEV_SESSION_COOKIE,
  isDatabaseAvailable,
  isExplicitDemoSession,
} from "@/lib/app-auth";
import { DEMO_PROFILE_COOKIE } from "@/lib/demo-fallback";
import { isClerkConfigured } from "@/lib/clerk-config";
import { isDevAuthAllowed, devAuthBlockedResponse } from "@/lib/api-guards";
import { getSessionCookieOptions } from "@/lib/session-cookies";

export async function POST() {
  if (!isDevAuthAllowed()) return devAuthBlockedResponse();

  if (isClerkConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Dev upgrade is only available without Clerk keys" },
      { status: 400 }
    );
  }

  const sessionCookie = cookies().get(DEV_SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { ok: false, error: "No active session" },
      { status: 401 }
    );
  }

  if (!isExplicitDemoSession()) {
    if (sessionCookie === "1") {
      return NextResponse.json({ ok: true, redirect: "/onboarding" });
    }
    return NextResponse.json({ ok: false, error: "Not in demo mode" }, { status: 400 });
  }

  const dbOk = await isDatabaseAvailable();
  if (!dbOk) {
    return NextResponse.json({
      ok: false,
      message: "PostgreSQL לא פעיל — הפעילו docker compose up -d && pnpm db:push",
    });
  }

  try {
    await ensureDevUser();
    cookies().set(DEV_SESSION_COOKIE, "1", getSessionCookieOptions(60 * 60 * 24 * 7));
    cookies().delete(DEMO_PROFILE_COOKIE);
    return NextResponse.json({ ok: true, redirect: "/onboarding" });
  } catch (error) {
    console.error("[dev/upgrade] Failed:", error);
    return NextResponse.json({
      ok: false,
      message: "לא הצלחנו לחבר את המערכת — נסו שוב בעוד רגע",
    });
  }
}
