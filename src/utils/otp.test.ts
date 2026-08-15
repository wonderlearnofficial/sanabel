import { describe, expect, it } from "vitest";
import { createEmptyOTP, isCompleteOTP, OTP_LENGTH } from "./otp";

describe("OTP helpers", () => {
  it("creates the four fields used by the UI and API", () => {
    expect(createEmptyOTP()).toEqual(["", "", "", ""]);
    expect(createEmptyOTP()).toHaveLength(OTP_LENGTH);
  });

  it("accepts exactly four numeric digits", () => {
    expect(isCompleteOTP(["2", "0", "0", "7"])).toBe(true);
    expect(isCompleteOTP(["2", "0", "0", ""])).toBe(false);
    expect(isCompleteOTP(["1", "2", "3", "4", "5", "6"])).toBe(false);
    expect(isCompleteOTP(["1", "2", "x", "4"])).toBe(false);
  });
});
