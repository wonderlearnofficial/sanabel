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

  it("maps admin controller rejections to specific Arabic message keys", () => {
    expect(
      describeApiError({
        response: {
          status: 400,
          data: {
            message:
              "Target class does not belong to the selected organization",
          },
        },
      }),
    ).toBe("الفصل المحدد لا يتبع المدرسة المختارة.");

    expect(
      describeApiError({
        response: { status: 409, data: { message: "Email already in use" } },
      }),
    ).toBe("البريد الإلكتروني مستخدم بالفعل.");

    expect(
      describeApiError({
        response: {
          status: 400,
          data: { message: "organizationId is required for this role" },
        },
      }),
    ).toBe("اختيار المدرسة مطلوب لهذا النوع من الحسابات.");
  });

  it("uses the active-language translator for admin errors", () => {
    const english: Record<string, string> = {
      "البريد الإلكتروني مستخدم بالفعل.":
        "This email address is already in use.",
      "الفصل رقم {{number}} غير موجود.": "Class {{number}} does not exist.",
    };
    const translate = (key: string, options?: Record<string, string>) =>
      (english[key] || key).replace(
        /{{(\w+)}}/g,
        (_, name: string) => options?.[name] || "",
      );

    expect(
      describeApiError(
        {
          response: {
            status: 409,
            data: { message: "Email already in use" },
          },
        },
        translate,
      ),
    ).toBe("This email address is already in use.");

    expect(
      describeApiError(
        {
          response: {
            status: 400,
            data: { message: "Class 42 does not exist" },
          },
        },
        translate,
      ),
    ).toBe("Class 42 does not exist.");
  });

  it("never returns a blank string for a mark-task-complete failure (production regression)", () => {
    // Reproduces the exact reported bug: a task-completion request fails on
    // the server for any unexpected reason (dropped DB connection, timeout,
    // etc.), addPros's catch-all responds, and the app must show something
    // specific — never an empty alert. The old client code computed
    // `errorData.message || response.statusText`, and response.statusText is
    // spec-empty for every HTTP/2 response (Vercel/Railway both serve over
    // HTTP/2, in every browser, not only Safari), so a server body missing
    // `message` rendered as a blank dialog. The server now always includes
    // `message`; this asserts describeApiError never renders blank either
    // way, as a second, independent layer of protection.
    const withMessage = describeApiError({
      response: { status: 500, data: { message: "Internal Server Error" } },
    });
    expect(withMessage.length).toBeGreaterThan(0);

    // Defense in depth: even a body with neither `message` nor `error` (the
    // pre-fix shape, or a future regression) must still not render blank.
    const withNeither = describeApiError({
      response: { status: 500, data: {} },
    });
    expect(withNeither.length).toBeGreaterThan(0);
  });
});
