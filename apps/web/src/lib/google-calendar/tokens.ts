import { prisma } from "@revenue-autopilot/lib/db";
import { shouldRefreshAccessToken } from "@revenue-autopilot/lib";
import type { Integration } from "@revenue-autopilot/lib/db";
import {
  refreshGoogleAccessToken,
  fetchCalendarEvents,
  GoogleCalendarApiError,
  type GoogleCalendarEvent,
} from "./api";

export type GoogleCalendarAuthErrorCode =
  | "not_connected"
  | "missing_refresh_token"
  | "refresh_failed"
  | "revoked";

export class GoogleCalendarAuthError extends Error {
  constructor(
    message: string,
    public code: GoogleCalendarAuthErrorCode
  ) {
    super(message);
    this.name = "GoogleCalendarAuthError";
  }
}

export interface GoogleCalendarIntegrationStatus {
  connected: boolean;
  active: boolean;
  tokenExpiresAt: string | null;
  needsReconnect: boolean;
  lastSyncAt: string | null;
  lastRefreshedAt: string | null;
  lastError: string | null;
}

function getIntegrationMetadata(integration: Integration): Record<string, unknown> {
  if (integration.metadata && typeof integration.metadata === "object") {
    return integration.metadata as Record<string, unknown>;
  }
  return {};
}

export async function getGoogleCalendarIntegration(organizationId: string) {
  return prisma.integration.findUnique({
    where: {
      organizationId_type: {
        organizationId,
        type: "GOOGLE_CALENDAR",
      },
    },
  });
}

export async function getGoogleCalendarStatus(
  organizationId: string
): Promise<GoogleCalendarIntegrationStatus> {
  const integration = await getGoogleCalendarIntegration(organizationId);
  if (!integration) {
    return {
      connected: false,
      active: false,
      tokenExpiresAt: null,
      needsReconnect: true,
      lastSyncAt: null,
      lastRefreshedAt: null,
      lastError: null,
    };
  }

  const meta = getIntegrationMetadata(integration);

  return {
    connected: !!(integration.accessToken && integration.active),
    active: integration.active,
    tokenExpiresAt: integration.tokenExpiresAt?.toISOString() ?? null,
    needsReconnect: !integration.refreshToken || !integration.active,
    lastSyncAt: (meta.lastSyncAt as string) ?? null,
    lastRefreshedAt: (meta.lastRefreshedAt as string) ?? null,
    lastError: (meta.lastError as string) ?? null,
  };
}

async function persistRefreshedTokens(
  integration: Integration,
  tokens: { access_token: string; expires_in: number; refresh_token?: string }
): Promise<string> {
  const meta = getIntegrationMetadata(integration);
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokens.access_token,
      tokenExpiresAt,
      refreshToken: tokens.refresh_token ?? integration.refreshToken,
      active: true,
      metadata: {
        ...meta,
        lastRefreshedAt: new Date().toISOString(),
        lastError: null,
      },
    },
  });

  return tokens.access_token;
}

async function markIntegrationRevoked(
  organizationId: string,
  error: string
): Promise<void> {
  const integration = await getGoogleCalendarIntegration(organizationId);
  if (!integration) return;

  const meta = getIntegrationMetadata(integration);

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      active: false,
      metadata: {
        ...meta,
        lastError: error,
        lastErrorAt: new Date().toISOString(),
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      action: "GOOGLE_CALENDAR_DISCONNECTED",
      entityType: "Integration",
      entityId: integration.id,
      metadata: { reason: error },
    },
  });
}

export async function refreshIntegrationAccessToken(
  organizationId: string,
  options?: { force?: boolean }
): Promise<string> {
  const integration = await getGoogleCalendarIntegration(organizationId);

  if (!integration?.accessToken) {
    throw new GoogleCalendarAuthError(
      "Google Calendar is not connected",
      "not_connected"
    );
  }

  const needsRefresh =
    options?.force ||
    shouldRefreshAccessToken(integration.tokenExpiresAt);

  if (!needsRefresh) {
    return integration.accessToken;
  }

  if (!integration.refreshToken) {
    await markIntegrationRevoked(
      organizationId,
      "Missing refresh token — reconnect Google Calendar"
    );
    throw new GoogleCalendarAuthError(
      "Missing refresh token — reconnect Google Calendar",
      "missing_refresh_token"
    );
  }

  try {
    const tokens = await refreshGoogleAccessToken(integration.refreshToken);
    return persistRefreshedTokens(integration, tokens);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Token refresh failed";

    const revoked =
      message.includes("invalid_grant") ||
      message.includes("Token has been expired or revoked");

    await markIntegrationRevoked(
      organizationId,
      revoked ? "Google access revoked — reconnect calendar" : message
    );

    throw new GoogleCalendarAuthError(
      revoked ? "Google access revoked — reconnect calendar" : message,
      revoked ? "revoked" : "refresh_failed"
    );
  }
}

export async function ensureValidGoogleAccessToken(
  organizationId: string
): Promise<string> {
  return refreshIntegrationAccessToken(organizationId);
}

export async function fetchCalendarEventsForOrganization(
  organizationId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  let accessToken = await ensureValidGoogleAccessToken(organizationId);

  try {
    return await fetchCalendarEvents(accessToken, timeMin, timeMax);
  } catch (error) {
    if (error instanceof GoogleCalendarApiError && error.isUnauthorized) {
      accessToken = await refreshIntegrationAccessToken(organizationId, {
        force: true,
      });
      return fetchCalendarEvents(accessToken, timeMin, timeMax);
    }
    throw error;
  }
}

export async function recordCalendarSyncSuccess(
  organizationId: string,
  synced: number
): Promise<void> {
  const integration = await getGoogleCalendarIntegration(organizationId);
  if (!integration) return;

  const meta = getIntegrationMetadata(integration);
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      metadata: {
        ...meta,
        lastSyncAt: new Date().toISOString(),
        lastSyncCount: synced,
        lastError: null,
      },
    },
  });
}

export async function recordCalendarSyncError(
  organizationId: string,
  error: string
): Promise<void> {
  const integration = await getGoogleCalendarIntegration(organizationId);
  if (!integration) return;

  const meta = getIntegrationMetadata(integration);
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      metadata: {
        ...meta,
        lastError: error,
        lastErrorAt: new Date().toISOString(),
      },
    },
  });
}
