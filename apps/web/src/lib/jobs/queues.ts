import { Queue } from "bullmq";
import { getRedisConnection, isRedisConfigured } from "./connection";
import {
  CALENDAR_SYNC_REPEAT_JOB_ID,
  QUEUE_NAMES,
  type AutofillJobData,
  type CalendarSyncJobData,
  type ReminderJobData,
} from "./types";

const CALENDAR_SYNC_INTERVAL_MS = 10 * 60 * 1000;

let reminderQueue: Queue<ReminderJobData> | null = null;
let calendarSyncQueue: Queue<CalendarSyncJobData> | null = null;
let autofillQueue: Queue<AutofillJobData> | null = null;

function createQueue<T>(name: string): Queue<T> {
  return new Queue<T>(name, { connection: getRedisConnection() });
}

export function getReminderQueue(): Queue<ReminderJobData> {
  if (!reminderQueue) {
    reminderQueue = createQueue<ReminderJobData>(QUEUE_NAMES.REMINDERS);
  }
  return reminderQueue;
}

export function getCalendarSyncQueue(): Queue<CalendarSyncJobData> {
  if (!calendarSyncQueue) {
    calendarSyncQueue = createQueue<CalendarSyncJobData>(QUEUE_NAMES.CALENDAR_SYNC);
  }
  return calendarSyncQueue;
}

export function getAutofillQueue(): Queue<AutofillJobData> {
  if (!autofillQueue) {
    autofillQueue = createQueue<AutofillJobData>(QUEUE_NAMES.AUTOFILL);
  }
  return autofillQueue;
}

export async function registerRepeatableJobs(): Promise<void> {
  if (!isRedisConfigured()) return;

  const queue = getCalendarSyncQueue();
  await queue.add(
    "sync-all",
    {},
    {
      repeat: { every: CALENDAR_SYNC_INTERVAL_MS },
      jobId: CALENDAR_SYNC_REPEAT_JOB_ID,
      removeOnComplete: 10,
      removeOnFail: 50,
    }
  );
}

export function getJobsStatus() {
  return {
    redisConfigured: isRedisConfigured(),
    calendarSyncIntervalMinutes: CALENDAR_SYNC_INTERVAL_MS / 60_000,
    queues: Object.values(QUEUE_NAMES),
  };
}
