import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import type { ActionTokenPayload } from "../types";

const TOKEN_EXPIRY = "24h";
const CLAIM_TOKEN_EXPIRY = "4h";

const actionTokenSchema = z.object({
  appointmentId: z.string().min(1),
  organizationId: z.string().min(1),
  action: z.enum(["confirm", "cancel", "claim"]),
  customerId: z.string().optional(),
});

function getSecret(): Uint8Array {
  const secret = process.env.ACTION_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ACTION_TOKEN_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-secret-change-in-production");
  }
  return new TextEncoder().encode(secret);
}

export async function createActionToken(
  payload: ActionTokenPayload
): Promise<string> {
  const expiry = payload.action === "claim" ? CLAIM_TOKEN_EXPIRY : TOKEN_EXPIRY;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(getSecret());
}

export async function verifyActionToken(
  token: string
): Promise<ActionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const parsed = actionTokenSchema.safeParse(payload);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function buildActionUrl(
  baseUrl: string,
  action: ActionTokenPayload["action"],
  token: string
): string {
  return `${baseUrl}/actions/${action}?token=${encodeURIComponent(token)}`;
}
