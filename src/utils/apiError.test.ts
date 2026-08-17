import { describe, expect, it } from "vitest";
import { describeApiError } from "./apiError";

describe("describeApiError", () => {
  it("identifies timeouts", () => {
    expect(describeApiError({ code: "ECONNABORTED" })).toMatch(/انتهت مهلة/);
  });

  it("identifies an unreachable server (no response)", () => {
    expect(describeApiError({ message: "Network Error" })).toMatch(
      /لا يمكن الوصول/,
    );
  });

  it("translates known server rejections to specific messages", () => {
    expect(
      describeApiError({
        response: { status: 400, data: { error: "Insufficient snabel balance" } },
      }),
    ).toMatch(/رصيد السنابل غير كافٍ/);

    expect(
      describeApiError({
        response: {
          status: 400,
          data: { message: "Not enough seeders or water to grow the tree" },
        },
      }),
    ).toMatch(/لا تملك ماءً أو سمادًا/);
  });

  it("identifies expired sessions and server errors", () => {
    expect(
      describeApiError({ response: { status: 401, data: {} } }),
    ).toMatch(/انتهت صلاحية جلستك/);

    expect(
      describeApiError({ response: { status: 500, data: {} } }),
    ).toMatch(/خطأ في الخادم/);
  });

  it("passes through unknown but specific server text instead of hiding it", () => {
    expect(
      describeApiError({
        response: { status: 400, data: { message: "Custom reason" } },
      }),
    ).toBe("Custom reason");
  });
});
