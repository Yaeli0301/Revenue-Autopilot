import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import { isRedisConfigured } from "@/lib/jobs/connection";
import {
  getJobsStatus,
  getReminderQueue,
  getCalendarSyncQueue,
  getAutofillQueue,
} from "@/lib/jobs/queues";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const status = getJobsStatus();

    if (!isRedisConfigured()) {
      return NextResponse.json({
        ok: true,
        ...status,
        workerRequired: true,
        message: "Set REDIS_URL and run pnpm worker",
      });
    }

    const [reminders, calendar, autofill] = await Promise.all([
      getReminderQueue().getJobCounts(),
      getCalendarSyncQueue().getJobCounts(),
      getAutofillQueue().getJobCounts(),
    ]);

    return NextResponse.json({
      ok: true,
      ...status,
      workerRequired: true,
      counts: { reminders, calendar, autofill },
    });
  } catch (error) {
    console.error("Jobs status error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not reach job queue — is Redis running?",
      },
      { status: 503 }
    );
  }
}
