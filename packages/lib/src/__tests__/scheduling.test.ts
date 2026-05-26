import { describe, it, expect } from "vitest";
import {
  getReminderDelayMs,
  getDelayUntilQuietHoursEndMs,
} from "../scheduling";

describe("getReminderDelayMs", () => {
  it("returns positive delay when reminder is in the future", () => {
    const start = new Date("2026-06-01T10:00:00Z");
    const now = new Date("2026-05-31T08:00:00Z");
    const delay = getReminderDelayMs(start, "REMINDER_24H", now);
    expect(delay).toBeGreaterThan(0);
  });

  it("returns negative when reminder time passed", () => {
    const start = new Date("2026-06-01T10:00:00Z");
    const now = new Date("2026-06-01T09:00:00Z");
    const delay = getReminderDelayMs(start, "REMINDER_24H", now);
    expect(delay).toBeLessThan(0);
  });

  it("24h reminder fires before 3h reminder", () => {
    const start = new Date("2026-06-01T12:00:00Z");
    const now = new Date("2026-05-30T12:00:00Z");
    const d24 = getReminderDelayMs(start, "REMINDER_24H", now);
    const d3 = getReminderDelayMs(start, "REMINDER_3H", now);
    expect(d24).toBeLessThan(d3);
    expect(d24).toBeGreaterThan(0);
    expect(d3).toBeGreaterThan(0);
  });
});

describe("getDelayUntilQuietHoursEndMs", () => {
  it("returns 0 outside quiet hours", () => {
    expect(getDelayUntilQuietHoursEndMs(12, 22, 8)).toBe(0);
  });

  it("returns delay during overnight quiet hours", () => {
    const delay = getDelayUntilQuietHoursEndMs(23, 22, 8);
    expect(delay).toBe(9 * 60 * 60 * 1000);
  });

  it("returns delay early morning in quiet hours", () => {
    const delay = getDelayUntilQuietHoursEndMs(3, 22, 8);
    expect(delay).toBe(5 * 60 * 60 * 1000);
  });
});
