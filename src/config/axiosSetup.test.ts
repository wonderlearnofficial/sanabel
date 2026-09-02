import { describe, expect, it } from "vitest";
import { TERMINAL_SESSION_CODES } from "./axiosSetup";

describe("terminal authentication responses", () => {
  it.each([
    "ACCOUNT_DELETED",
    "ACCOUNT_DISABLED",
    "ACCOUNT_CHANGED",
    "SESSION_REVOKED",
  ])("logs out rather than refreshing for %s", (code) => {
    expect(TERMINAL_SESSION_CODES.has(code)).toBe(true);
  });

  it("keeps ordinary access-token expiry refreshable", () => {
    expect(TERMINAL_SESSION_CODES.has("TOKEN_EXPIRED")).toBe(false);
  });
});
