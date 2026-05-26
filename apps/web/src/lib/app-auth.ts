import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@revenue-autopilot/lib/db";
import type { User as DbUser } from "@revenue-autopilot/lib/db";
import { ensureUser } from "./auth";
import { isClerkConfigured } from "./clerk-config";
import {
  DEMO_SESSION_VALUE,
  getDemoProfileFromCookies,
  type DemoProfile,
} from "./demo-fallback";
import { getSessionCookieOptions } from "./session-cookies";

export const DEV_SESSION_COOKIE = "dev_session";
export const DEV_CLERK_ID = "dev_local_demo";

export interface AuthContext {
  dbUser: DbUser | null;
  /** True ONLY when dev_session cookie is explicitly "demo". */
  demoMode: boolean;
  demoProfile: DemoProfile;
}

export async function ensureDevUser(): Promise<DbUser> {
  return prisma.user.upsert({
    where: { clerkId: DEV_CLERK_ID },
    create: {
      clerkId: DEV_CLERK_ID,
      email: "demo@local.dev",
      name: "משתמש דמו",
    },
    update: {},
  });
}

export function isDevSessionActive(): boolean {
  const value = cookies().get(DEV_SESSION_COOKIE)?.value;
  return value === "1" || value === DEMO_SESSION_VALUE;
}

export function isExplicitDemoSession(): boolean {
  return cookies().get(DEV_SESSION_COOKIE)?.value === DEMO_SESSION_VALUE;
}

/** @deprecated Use isExplicitDemoSession */
export function isDemoFallbackActive(): boolean {
  return isExplicitDemoSession();
}

function clearDevSessionCookie(): void {
  cookies().set(DEV_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthContext(): Promise<AuthContext | null> {
  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    try {
      const dbUser = await ensureUser(clerkUser);
      return { dbUser, demoMode: false, demoProfile: {} };
    } catch (error) {
      console.error("[auth] Clerk user sync failed:", error);
      return null;
    }
  }

  const sessionValue = cookies().get(DEV_SESSION_COOKIE)?.value;
  if (!sessionValue) return null;

  if (sessionValue === DEMO_SESSION_VALUE) {
    return {
      dbUser: null,
      demoMode: true,
      demoProfile: getDemoProfileFromCookies(),
    };
  }

  if (sessionValue !== "1") {
    clearDevSessionCookie();
    return null;
  }

  try {
    const dbUser = await ensureDevUser();
    return { dbUser, demoMode: false, demoProfile: {} };
  } catch (error) {
    console.error("[auth] Real session invalid — DB unavailable:", error);
    clearDevSessionCookie();
    return null;
  }
}

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export function setExplicitDemoSessionCookie(): void {
  cookies().set(
    DEV_SESSION_COOKIE,
    DEMO_SESSION_VALUE,
    getSessionCookieOptions(60 * 60 * 24 * 7)
  );
}

export function setRealDevSessionCookie(): void {
  cookies().set(DEV_SESSION_COOKIE, "1", getSessionCookieOptions(60 * 60 * 24 * 7));
}
