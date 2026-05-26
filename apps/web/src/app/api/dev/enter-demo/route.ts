import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isClerkConfigured } from "@/lib/clerk-config";
import { isDevAuthAllowed, devAuthBlockedResponse } from "@/lib/api-guards";
import { getSessionCookieOptions } from "@/lib/session-cookies";
import {
  setExplicitDemoSessionCookie,
} from "@/lib/app-auth";
import { DEMO_PROFILE_COOKIE } from "@/lib/demo-fallback";

const MAX_PROFILE_BYTES = 2048;

/**
 * Explicit demo entry ONLY — user must intentionally request demo mode.
 * Sets dev_session=demo cookie. No DB required.
 */
export async function POST(req: Request) {
  if (!isDevAuthAllowed()) return devAuthBlockedResponse();

  if (isClerkConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Demo entry is only available in dev mode without Clerk" },
      { status: 400 }
    );
  }

  let body: { businessName?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* optional */
  }

  const profile = {
    businessName: body.businessName?.trim().slice(0, 100) || undefined,
    email: body.email?.trim().slice(0, 254) || undefined,
  };

  setExplicitDemoSessionCookie();

  const profileJson = JSON.stringify(profile);
  if (profileJson.length <= MAX_PROFILE_BYTES) {
    cookies().set(
      DEMO_PROFILE_COOKIE,
      encodeURIComponent(profileJson),
      getSessionCookieOptions(60 * 60 * 24 * 7)
    );
  }

  return NextResponse.json({
    ok: true,
    redirect: "/dashboard?welcome=1",
    demoMode: true,
  });
}
