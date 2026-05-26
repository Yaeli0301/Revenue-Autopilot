import { SignJWT, jwtVerify } from "jose";

/** Refresh access token this many ms before expiry. */
export const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export function shouldRefreshAccessToken(
  expiresAt: Date | null | undefined,
  now = Date.now(),
  bufferMs = TOKEN_EXPIRY_BUFFER_MS
): boolean {
  if (!expiresAt) return true;
  return now >= expiresAt.getTime() - bufferMs;
}

function getOAuthStateSecret(): Uint8Array {
  const secret = process.env.ACTION_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ACTION_TOKEN_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-secret-change-in-production");
  }
  return new TextEncoder().encode(secret);
}

export async function createOAuthState(
  organizationId: string,
  userId: string
): Promise<string> {
  return new SignJWT({ organizationId, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getOAuthStateSecret());
}

export async function verifyOAuthState(
  state: string
): Promise<{ organizationId: string; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(state, getOAuthStateSecret());
    const organizationId = payload.organizationId;
    const userId = payload.userId;
    if (typeof organizationId !== "string" || typeof userId !== "string") {
      return null;
    }
    return { organizationId, userId };
  } catch {
    return null;
  }
}
