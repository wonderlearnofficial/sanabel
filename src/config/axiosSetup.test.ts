import { describe, expect, it } from "vitest";
import {
  TERMINAL_SESSION_CODES,
  isRefreshableAuthFailure,
} from "./axiosSetup";

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

  it.each([
    [401, "TOKEN_EXPIRED"],
    [401, "TOKEN_INVALID"],
    [403, "TOKEN_INVALID"],
  ])("refreshes the access token on %s %s", (status, code) => {
    expect(isRefreshableAuthFailure(status, code)).toBe(true);
  });

  it.each([
    [401, undefined],
    [401, "ACCOUNT_DISABLED"],
    [403, undefined],
    [500, "TOKEN_INVALID"],
  ])("does not refresh on %s %s", (status, code) => {
    expect(isRefreshableAuthFailure(status, code)).toBe(false);
  });
});
