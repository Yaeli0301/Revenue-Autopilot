import { describe, it, expect } from "vitest";
import {
  shouldRefreshAccessToken,
  TOKEN_EXPIRY_BUFFER_MS,
} from "../oauth";

describe("shouldRefreshAccessToken", () => {
  it("returns true when no expiry", () => {
    expect(shouldRefreshAccessToken(null)).toBe(true);
    expect(shouldRefreshAccessToken(undefined)).toBe(true);
  });

  it("returns false when token is fresh", () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    expect(shouldRefreshAccessToken(expiresAt)).toBe(false);
  });

  it("returns true within buffer window", () => {
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_BUFFER_MS - 1000);
    expect(shouldRefreshAccessToken(expiresAt)).toBe(true);
  });

  it("returns true when expired", () => {
    const expiresAt = new Date(Date.now() - 1000);
    expect(shouldRefreshAccessToken(expiresAt)).toBe(true);
  });
});
