import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import { scheduleRemindersForOrganization } from "@/lib/jobs/schedule";
import { enqueueCalendarSync } from "@/lib/jobs/enqueue";
import { syncOrganizationCalendar } from "@/lib/calendar/sync-org";
import { sendInitialConfirmations } from "@/lib/messaging/initial-send";

export async function POST() {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });
    }

    if (org.onboardingDone && org.autopilotActive) {
      return NextResponse.json({ ok: true, alreadyActive: true });
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        autopilotActive: true,
        onboardingDone: true,
      },
    });

    const syncResult = await syncOrganizationCalendar(org.id);
    const messagesSent =
      syncResult.source === "demo"
        ? 0
        : await sendInitialConfirmations(org.id);
    const remindersScheduled = await scheduleRemindersForOrganization(org.id);
    await enqueueCalendarSync(org.id);

    try {
      await prisma.auditEvent.create({
        data: {
          organizationId: org.id,
          userId: ctx!.dbUser!.id,
          action: "AUTOPILOT_ACTIVATED",
          metadata: {
            remindersScheduled,
            messagesSent,
            synced: syncResult.synced,
            source: syncResult.source,
          },
        },
      });
    } catch (auditError) {
      console.error("[activate] Audit log failed (non-blocking):", auditError);
    }

    return NextResponse.json({
      ok: true,
      remindersScheduled,
      messagesSent,
      synced: syncResult.synced,
      source: syncResult.source,
    });
  } catch (error) {
    console.error("Activate error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
