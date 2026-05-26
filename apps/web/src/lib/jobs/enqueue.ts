import { isRedisConfigured } from "./connection";
import { getAutofillQueue, getCalendarSyncQueue } from "./queues";

export async function enqueueAutofill(params: {
  appointmentId: string;
  organizationId: string;
}): Promise<boolean> {
  if (!isRedisConfigured()) return false;

  const queue = getAutofillQueue();
  await queue.add(
    "cancellation",
    params,
    {
      jobId: `autofill-${params.appointmentId}`,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
    }
  );
  return true;
}

export async function enqueueCalendarSync(
  organizationId?: string
): Promise<boolean> {
  if (!isRedisConfigured()) return false;

  const queue = getCalendarSyncQueue();
  await queue.add(
    organizationId ? "sync-org" : "sync-all",
    { organizationId },
    {
      ...(organizationId
        ? { jobId: `calendar-sync-${organizationId}-${Date.now()}` }
        : {}),
      removeOnComplete: 10,
      removeOnFail: 20,
    }
  );
  return true;
}
