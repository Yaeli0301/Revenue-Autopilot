import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEV_SESSION_COOKIE } from "@/lib/app-auth";
import { DEMO_PROFILE_COOKIE } from "@/lib/demo-fallback";
import { isDevAuthAllowed, devAuthBlockedResponse } from "@/lib/api-guards";

export async function POST() {
  if (!isDevAuthAllowed()) return devAuthBlockedResponse();

  cookies().set(DEV_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  cookies().delete(DEMO_PROFILE_COOKIE);

  return NextResponse.json({ ok: true, redirect: "/" });
}
