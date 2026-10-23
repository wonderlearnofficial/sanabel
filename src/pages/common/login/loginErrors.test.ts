import { describe, expect, it } from "vitest";
import { describeLoginError, validateLoginFields } from "./loginErrors";

const fail = (status: number, data: Record<string, unknown> = {}) => ({
  response: { status, data },
});

describe("validateLoginFields", () => {
  it("names the missing fields", () => {
    expect(validateLoginFields("", "")).toMatch(/البريد الإلكتروني وكلمة المرور/);
    expect(validateLoginFields("  ", "secret")).toBe("يرجى إدخال البريد الإلكتروني.");
    expect(validateLoginFields("a@b.co", "")).toBe("يرجى إدخال كلمة المرور.");
    expect(validateLoginFields("a@b.co", "secret")).toBeNull();
  });
});

describe("describeLoginError", () => {
  it("explains a disabled account instead of an expired session", () => {
    const message = describeLoginError(
      fail(401, {
        code: "ACCOUNT_DISABLED",
        message: "Account access has been disabled",
      }),
    );
    expect(message).toMatch(/إيقاف الوصول/);
    expect(message).not.toMatch(/انتهت صلاحية جلستك/);
  });

  it("explains an unfinished signup on 409", () => {
    expect(
      describeLoginError(fail(409, { message: "Signup not completed" })),
    ).toMatch(/لم يكتمل إنشاء هذا الحساب/);
  });

  it("asks for the fields when the server returns 400", () => {
    expect(describeLoginError(fail(400, { message: "Email and password are required" }))).toBe(
      "fill_all_fields",
    );
  });

  it("keeps wrong credentials specific", () => {
    expect(
      describeLoginError(fail(401, { message: "Incorrect email or password" })),
    ).toMatch(/البريد الإلكتروني أو كلمة المرور غير صحيحة/);
    expect(describeLoginError(fail(401))).toBe("login_failed");
  });
});
