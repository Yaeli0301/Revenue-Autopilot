import { describe, it, expect } from "vitest";
import {
  isSubscriptionActive,
  isTrialActive,
  getTrialDaysRemaining,
  TRIAL_DAYS,
} from "../billing";

const baseOrg = {
  subStatus: "TRIALING" as const,
  subscriptionPlan: "FREE" as const,
  createdAt: new Date(),
};

describe("isTrialActive", () => {
  it("returns true within trial period", () => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 3);
    expect(isTrialActive({ ...baseOrg, createdAt })).toBe(true);
  });

  it("returns false after trial period", () => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (TRIAL_DAYS + 1));
    expect(isTrialActive({ ...baseOrg, createdAt })).toBe(false);
  });
});

describe("isSubscriptionActive", () => {
  it("returns true for ACTIVE status", () => {
    expect(
      isSubscriptionActive({ ...baseOrg, subStatus: "ACTIVE" })
    ).toBe(true);
  });

  it("returns true during trial", () => {
    expect(isSubscriptionActive(baseOrg)).toBe(true);
  });

  it("returns false when trial expired", () => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (TRIAL_DAYS + 1));
    expect(
      isSubscriptionActive({ ...baseOrg, createdAt })
    ).toBe(false);
  });

  it("returns false for cancelled", () => {
    expect(
      isSubscriptionActive({ ...baseOrg, subStatus: "CANCELLED" })
    ).toBe(false);
  });
});

describe("getTrialDaysRemaining", () => {
  it("returns remaining days", () => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 2);
    const remaining = getTrialDaysRemaining({ ...baseOrg, createdAt });
    expect(remaining).toBe(TRIAL_DAYS - 2);
  });
});
