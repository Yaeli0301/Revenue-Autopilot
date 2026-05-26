import { prisma } from "@revenue-autopilot/lib/db";
import { syncDemoAppointments } from "@/lib/calendar-sync";
import {
  scheduleAppointmentReminders,
  scheduleRemindersForOrganization,
} from "@/lib/jobs/schedule";
import {
  fetchCalendarEventsForOrganization,
  getGoogleCalendarIntegration,
  GoogleCalendarAuthError,
  recordCalendarSyncError,
  recordCalendarSyncSuccess,
} from "@/lib/google-calendar";
import { isDemoSeedingAllowed } from "@/lib/api-guards";

export interface SyncOrgResult {
  organizationId: string;
  synced: number;
  source: "google" | "demo" | "skipped";
  remindersScheduled?: number;
  error?: string;
  authError?: boolean;
}

export async function syncOrganizationCalendar(
  organizationId: string
): Promise<SyncOrgResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org || !org.autopilotActive || !org.onboardingDone) {
    return {
      organizationId,
      synced: 0,
      source: "skipped",
    };
  }

  const integration = await getGoogleCalendarIntegration(organizationId);

  if (!integration?.accessToken || !integration.active) {
    if (!isDemoSeedingAllowed()) {
      return {
        organizationId,
        synced: 0,
        source: "skipped",
        error: "No calendar connected",
      };
    }
    const synced = await syncDemoAppointments(organizationId);
    const remindersScheduled = await scheduleRemindersForOrganization(organizationId);
    return {
      organizationId,
      synced,
      source: "demo",
      remindersScheduled,
    };
  }

  try {
    const now = new Date();
    const monthAhead = new Date();
    monthAhead.setDate(monthAhead.getDate() + 30);

    const events = await fetchCalendarEventsForOrganization(
      organizationId,
      now.toISOString(),
      monthAhead.toISOString()
    );

    let synced = 0;
    const upsertedIds: string[] = [];

    for (const event of events) {
      if (!event.id || !event.start?.dateTime) continue;

      const attendee = event.attendees?.[0];
      const customerName =
        attendee?.displayName ?? attendee?.email?.split("@")[0] ?? "לקוח";
      const customerEmail = attendee?.email;

      let customer = await prisma.customer.findFirst({
        where: {
          organizationId,
          OR: [
            ...(customerEmail ? [{ email: customerEmail }] : []),
            { externalId: attendee?.email },
          ],
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            organizationId,
            name: customerName,
            email: customerEmail,
            externalId: attendee?.email,
          },
        });
      }

      const appointment = await prisma.appointment.upsert({
        where: {
          organizationId_externalId: {
            organizationId,
            externalId: event.id,
          },
        },
        create: {
          organizationId,
          customerId: customer.id,
          title: event.summary ?? "תור",
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end?.dateTime ?? event.start.dateTime),
          externalId: event.id,
          price: org.avgPrice,
          status: "SCHEDULED",
        },
        update: {
          title: event.summary ?? "תור",
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end?.dateTime ?? event.start.dateTime),
        },
      });

      upsertedIds.push(appointment.id);
      synced++;
    }

    let remindersScheduled = 0;
    for (const id of upsertedIds) {
      const result = await scheduleAppointmentReminders(id);
      remindersScheduled += result.scheduled.length;
    }

    await recordCalendarSyncSuccess(organizationId, synced);

    return {
      organizationId,
      synced,
      source: "google",
      remindersScheduled,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync_failed";
    const authError = error instanceof GoogleCalendarAuthError;

    await recordCalendarSyncError(organizationId, message);

    return {
      organizationId,
      synced: 0,
      source: "google",
      error: message,
      authError,
    };
  }
}

export async function syncAllActiveOrganizations(): Promise<SyncOrgResult[]> {
  const orgs = await prisma.organization.findMany({
    where: { autopilotActive: true, onboardingDone: true },
    select: { id: true },
  });

  const results: SyncOrgResult[] = [];
  for (const org of orgs) {
    results.push(await syncOrganizationCalendar(org.id));
  }
  return results;
}
