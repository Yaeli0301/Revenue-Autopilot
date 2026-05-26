import { describe, it, expect } from "vitest";
import { normalizePhone, isValidPhone } from "../messaging/phone";
import { routeChannel } from "../messaging";

describe("normalizePhone", () => {
  it("normalizes Israeli local format", () => {
    expect(normalizePhone("050-123-4567")).toBe("+972501234567");
  });

  it("keeps E.164 format", () => {
    expect(normalizePhone("+972501234567")).toBe("+972501234567");
  });

  it("handles 9-digit without leading zero", () => {
    expect(normalizePhone("501234567")).toBe("+972501234567");
  });

  it("returns null for invalid", () => {
    expect(normalizePhone("123")).toBeNull();
  });
});

describe("isValidPhone", () => {
  it("validates normalized numbers", () => {
    expect(isValidPhone("0501234567")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("routeChannel SMS-first", () => {
  it("prefers SMS over WhatsApp by default", () => {
    const result = routeChannel({
      phone: "0501234567",
      email: "test@example.com",
      whatsappOptIn: true,
    });
    expect(result?.channel).toBe("SMS");
    expect(result?.recipient).toBe("+972501234567");
  });

  it("uses WhatsApp when explicitly enabled", () => {
    const result = routeChannel(
      {
        phone: "0501234567",
        whatsappOptIn: true,
      },
      { enableWhatsApp: true }
    );
    expect(result?.channel).toBe("WHATSAPP");
  });

  it("falls back to email without phone", () => {
    const result = routeChannel({ email: "test@example.com" });
    expect(result?.channel).toBe("EMAIL");
  });
});
