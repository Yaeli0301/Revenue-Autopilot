import { describe, it, expect } from "vitest";
import { buildDedupeKey, isWithinQuietHours, calculateRevenueSaved } from "../utils";
import { routeChannel, renderTemplate } from "../messaging";

describe("buildDedupeKey", () => {
  it("creates unique keys for different messages", () => {
    const key1 = buildDedupeKey({
      organizationId: "org1",
      appointmentId: "apt1",
      template: "CONFIRM",
      channel: "SMS",
      recipient: "+972501234567",
    });
    const key2 = buildDedupeKey({
      organizationId: "org1",
      appointmentId: "apt1",
      template: "REMINDER_24H",
      channel: "SMS",
      recipient: "+972501234567",
    });
    expect(key1).not.toBe(key2);
  });

  it("is deterministic", () => {
    const params = {
      organizationId: "org1",
      appointmentId: "apt1",
      template: "CONFIRM",
      channel: "SMS",
      recipient: "+972501234567",
    };
    expect(buildDedupeKey(params)).toBe(buildDedupeKey(params));
  });
});

describe("routeChannel", () => {
  it("prefers SMS when WhatsApp not enabled", () => {
    const result = routeChannel({
      phone: "+972501234567",
      email: "test@example.com",
      whatsappOptIn: true,
    });
    expect(result?.channel).toBe("SMS");
  });

  it("uses WhatsApp when enabled and opted in", () => {
    const result = routeChannel(
      {
        phone: "+972501234567",
        whatsappOptIn: true,
      },
      { enableWhatsApp: true }
    );
    expect(result?.channel).toBe("WHATSAPP");
  });

  it("falls back to SMS", () => {
    const result = routeChannel({
      phone: "+972501234567",
      email: "test@example.com",
      whatsappOptIn: false,
    });
    expect(result?.channel).toBe("SMS");
  });

  it("falls back to email", () => {
    const result = routeChannel({ email: "test@example.com" });
    expect(result?.channel).toBe("EMAIL");
  });

  it("returns null when no contact", () => {
    expect(routeChannel({})).toBeNull();
  });
});

describe("isWithinQuietHours", () => {
  it("handles same-day quiet hours", () => {
    expect(isWithinQuietHours(23, 22, 8)).toBe(true);
    expect(isWithinQuietHours(10, 22, 8)).toBe(false);
  });

  it("handles overnight quiet hours", () => {
    expect(isWithinQuietHours(23, 22, 8)).toBe(true);
    expect(isWithinQuietHours(3, 22, 8)).toBe(true);
    expect(isWithinQuietHours(12, 22, 8)).toBe(false);
  });
});

describe("calculateRevenueSaved", () => {
  it("sums autofill and confirmed at-risk", () => {
    expect(
      calculateRevenueSaved({
        autofillWins: 3,
        confirmedFromAtRisk: 2,
        avgPrice: 200,
      })
    ).toBe(1000);
  });
});

describe("renderTemplate", () => {
  it("renders confirm template in Hebrew", () => {
    const body = renderTemplate("CONFIRM", {
      customerName: "דנה",
      date: "24/05",
      time: "10:00",
      confirmUrl: "https://example.com/confirm",
    });
    expect(body).toContain("דנה");
    expect(body).toContain("https://example.com/confirm");
  });
});
