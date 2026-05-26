import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import { syncOrganizationCalendar } from "@/lib/calendar/sync-org";
import { enqueueCalendarSync } from "@/lib/jobs/enqueue";

export async function POST() {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });
    }

    const result = await syncOrganizationCalendar(org.id);

    try {
      await prisma.auditEvent.create({
        data: {
          organizationId: org.id,
          userId: ctx!.dbUser!.id,
          action: "CALENDAR_SYNC",
          metadata: { ...result } as object,
        },
      });
    } catch (auditError) {
      console.error("[calendar/sync] Audit log failed (non-blocking):", auditError);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });
    }

    const queued = await enqueueCalendarSync(org.id);
    return NextResponse.json({
      ok: true,
      queued,
      message: queued ? "Sync queued" : "Redis not configured",
    });
  } catch (error) {
    console.error("Calendar sync queue error:", error);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
