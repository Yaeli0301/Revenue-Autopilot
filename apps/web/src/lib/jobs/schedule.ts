import { prisma } from "@revenue-autopilot/lib/db";
import { getReminderDelayMs, isSubscriptionActive, type ReminderTemplate } from "@revenue-autopilot/lib";
import { isRedisConfigured } from "./connection";
import { getReminderQueue } from "./queues";
import { reminderJobId } from "./types";

const REMINDABLE_STATUSES = ["SCHEDULED", "AT_RISK"] as const;

export async function cancelAppointmentReminders(
  appointmentId: string
): Promise<void> {
  if (!isRedisConfigured()) return;

  const queue = getReminderQueue();
  for (const template of ["REMINDER_24H", "REMINDER_3H"] as const) {
    const job = await queue.getJob(reminderJobId(appointmentId, template));
    if (job) await job.remove();
  }
}

export async function cancelRemindersForOrganization(
  organizationId: string
): Promise<void> {
  if (!isRedisConfigured()) return;

  const appointments = await prisma.appointment.findMany({
    where: { organizationId },
    select: { id: true },
  });

  for (const apt of appointments) {
    await cancelAppointmentReminders(apt.id);
  }
}

export async function scheduleAppointmentReminders(
  appointmentId: string
): Promise<{ scheduled: string[] }> {
  if (!isRedisConfigured()) {
    return { scheduled: [] };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { organization: true },
  });

  if (!appointment) return { scheduled: [] };
  if (!REMINDABLE_STATUSES.includes(appointment.status as typeof REMINDABLE_STATUSES[number])) {
    await cancelAppointmentReminders(appointmentId);
    return { scheduled: [] };
  }
  if (!appointment.organization.autopilotActive) {
    return { scheduled: [] };
  }
  if (!isSubscriptionActive(appointment.organization)) {
    return { scheduled: [] };
  }

  const rule = await prisma.automationRule.findFirst({
    where: { organizationId: appointment.organizationId, enabled: true },
  });

  const queue = getReminderQueue();
  const scheduled: string[] = [];
  const templates: Array<{ template: ReminderTemplate; enabled: boolean }> = [
    { template: "REMINDER_24H", enabled: rule?.reminder24h ?? true },
    { template: "REMINDER_3H", enabled: rule?.reminder3h ?? true },
  ];

  for (const { template, enabled } of templates) {
    const id = reminderJobId(appointmentId, template);
    const existing = await queue.getJob(id);
    if (existing) await existing.remove();

    if (!enabled) continue;

    const delay = getReminderDelayMs(appointment.startTime, template);
    if (delay <= 0) continue;

    await queue.add(
      template,
      {
        appointmentId,
        organizationId: appointment.organizationId,
        template,
      },
      {
        jobId: id,
        delay,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
      }
    );
    scheduled.push(template);
  }

  return { scheduled };
}

export async function scheduleRemindersForOrganization(
  organizationId: string
): Promise<number> {
  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      status: { in: [...REMINDABLE_STATUSES] },
      startTime: { gt: new Date() },
    },
    select: { id: true },
  });

  let count = 0;
  for (const apt of appointments) {
    const result = await scheduleAppointmentReminders(apt.id);
    count += result.scheduled.length;
  }
  return count;
}
