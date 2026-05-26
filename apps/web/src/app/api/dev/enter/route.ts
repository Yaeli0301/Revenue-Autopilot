import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ensureDevUser,
  isDatabaseAvailable,
  setRealDevSessionCookie,
} from "@/lib/app-auth";
import { DEMO_PROFILE_COOKIE } from "@/lib/demo-fallback";
import { isClerkConfigured } from "@/lib/clerk-config";
import { isDevAuthAllowed, devAuthBlockedResponse } from "@/lib/api-guards";

/**
 * REAL signup/login only. Requires PostgreSQL. Never falls back to demo.
 */
export async function POST(req: Request) {
  if (!isDevAuthAllowed()) return devAuthBlockedResponse();

  if (isClerkConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Dev login is only available without Clerk keys" },
      { status: 400 }
    );
  }

  let body: { businessName?: string; email?: string; explicitDemo?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* optional body */
  }

  if (body.explicitDemo === true) {
    return NextResponse.json(
      {
        ok: false,
        error: "Use POST /api/dev/enter-demo for explicit demo mode",
      },
      { status: 400 }
    );
  }

  const dbOk = await isDatabaseAvailable();
  if (!dbOk) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "המערכת לא מחוברת לשרת. הפעילו PostgreSQL (docker compose up -d) והריצו pnpm db:push",
      },
      { status: 503 }
    );
  }

  try {
    await ensureDevUser();
    setRealDevSessionCookie();
    cookies().delete(DEMO_PROFILE_COOKIE);

    return NextResponse.json({
      ok: true,
      redirect: "/onboarding",
      demoMode: false,
    });
  } catch (error) {
    console.error("[dev/enter] Real session failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "לא הצלחנו ליצור חשבון — בדקו שה-database פעיל",
      },
      { status: 500 }
    );
  }
}
