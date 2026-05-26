import { Worker, type Job } from "bullmq";
import { formatInTimeZone } from "date-fns-tz";
import { getDelayUntilQuietHoursEndMs, isWithinQuietHours } from "@revenue-autopilot/lib";
import { getRedisConnection, isRedisConfigured } from "@/lib/jobs/connection";
import { QUEUE_NAMES, type AutofillJobData, type CalendarSyncJobData, type ReminderJobData } from "@/lib/jobs/types";
import { registerRepeatableJobs } from "@/lib/jobs/queues";
import { sendAppointmentReminder } from "@/lib/messaging/reminder";
import { syncAllActiveOrganizations, syncOrganizationCalendar } from "@/lib/calendar/sync-org";
import { handleCancellation } from "@/lib/autofill";
import { prisma } from "@revenue-autopilot/lib/db";

async function processReminderJob(job: Job<ReminderJobData>): Promise<void> {
  const { appointmentId, organizationId, template } = job.data;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: { organization: true },
  });

  if (!appointment) return;

  const hour = Number(
    formatInTimeZone(new Date(), appointment.organization.timezone, "H")
  );

  if (
    isWithinQuietHours(
      hour,
      appointment.organization.quietHoursStart,
      appointment.organization.quietHoursEnd
    )
  ) {
    const delayMs = getDelayUntilQuietHoursEndMs(
      hour,
      appointment.organization.quietHoursStart,
      appointment.organization.quietHoursEnd
    );
    await job.moveToDelayed(Date.now() + delayMs);
    return;
  }

  const result = await sendAppointmentReminder({
    appointmentId,
    organizationId,
    template,
  });

  if (result.error) {
    throw new Error(result.error);
  }
}

async function processCalendarSyncJob(job: Job<CalendarSyncJobData>): Promise<void> {
  if (job.data.organizationId) {
    await syncOrganizationCalendar(job.data.organizationId);
    return;
  }
  await syncAllActiveOrganizations();
}

async function processAutofillJob(job: Job<AutofillJobData>): Promise<void> {
  await handleCancellation(job.data.appointmentId, job.data.organizationId);
}

export async function startWorkers(): Promise<() => Promise<void>> {
  if (!isRedisConfigured()) {
    console.warn("[worker] REDIS_URL not set — workers not started");
    return async () => {};
  }

  const connection = getRedisConnection();

  const reminderWorker = new Worker<ReminderJobData>(
    QUEUE_NAMES.REMINDERS,
    processReminderJob,
    { connection, concurrency: 5 }
  );

  const calendarWorker = new Worker<CalendarSyncJobData>(
    QUEUE_NAMES.CALENDAR_SYNC,
    processCalendarSyncJob,
    { connection, concurrency: 2 }
  );

  const autofillWorker = new Worker<AutofillJobData>(
    QUEUE_NAMES.AUTOFILL,
    processAutofillJob,
    { connection, concurrency: 3 }
  );

  for (const worker of [reminderWorker, calendarWorker, autofillWorker]) {
    worker.on("failed", (job, err) => {
      console.error(`[worker:${worker.name}] job ${job?.id} failed:`, err.message);
    });
    worker.on("completed", (job) => {
      console.log(`[worker:${worker.name}] job ${job.id} completed`);
    });
  }

  await registerRepeatableJobs();
  console.log("[worker] BullMQ workers started (reminders, calendar-sync, autofill)");

  return async () => {
    await Promise.all([
      reminderWorker.close(),
      calendarWorker.close(),
      autofillWorker.close(),
    ]);
  };
}
