import { describe, expect, it } from "vitest";
import { isUnsupportedExperience, resolveExperience } from "../resolveExperience";

// The final Student truth table. Organization membership decides Solo vs
// School; class placement never decides reward mode
// (docs/GAMEPLAY_ALIGNMENT.md §5-8).

const student = (organizationId: number | null, classId: number | null) =>
  resolveExperience({
    role: "Student",
    organizationId,
    classId,
    userId: 7,
    email: "student@example.com",
    locale: "ar",
  });

describe("student experience resolution", () => {
  it("CASE 1: no organization, no class -> solo, instant reward", () => {
    const context = student(null, null);
    expect(context.experience).toBe("solo");
    expect(context.rewardMode).toBe("instant");
    expect(context.scope).toBe("solo");
    expect(context.dataFault).toBe(false);
  });

  it("CASE 2: organization and class -> school student, approval", () => {
    const context = student(11, 4);
    expect(context.experience).toBe("school-student");
    expect(context.rewardMode).toBe("approval");
    expect(context.scope).toBe("organization");
    expect(context.dataFault).toBe(false);
  });

  it("CASE 3: organization without class -> school student, still approval", () => {
    const context = student(11, null);
    expect(context.experience).toBe("school-student");
    // There is no "awaiting class means instant reward" exception any more.
    expect(context.rewardMode).toBe("approval");
    expect(context.dataFault).toBe(false);
  });

  it("CASE 4: class without organization -> fails closed and is flagged", () => {
    const context = student(null, 4);
    expect(context.experience).toBe("school-student");
    expect(context.rewardMode).toBe("approval");
    expect(context.dataFault).toBe(true);
  });

  it("never derives reward mode from class placement alone", () => {
    // Same class value, different organization: mode follows the organization
    // rule, and the only case where a class matters is the data fault.
    expect(student(11, 4).rewardMode).toBe(student(11, null).rewardMode);
    expect(student(null, null).rewardMode).toBe("instant");
    expect(student(null, 4).rewardMode).toBe("approval");
  });
});

describe("adult and admin experiences", () => {
  it("resolves Teacher", () => {
    const context = resolveExperience({ role: "Teacher", organizationId: 11 });
    expect(context.experience).toBe("teacher");
    expect(context.scope).toBe("organization");
  });

  it("resolves Parent", () => {
    const context = resolveExperience({ role: "Parent", childCount: 2 });
    expect(context.experience).toBe("parent");
    expect(context.childCount).toBe(2);
  });

  it("resolves Super Admin from a null admin scope", () => {
    const context = resolveExperience({
      role: "Admin",
      organizationId: null,
      isSuperAdmin: true,
    });
    expect(context.experience).toBe("super-admin");
    expect(context.scope).toBe("platform");
  });

  it("resolves School Admin from an organization-scoped admin", () => {
    const context = resolveExperience({
      role: "Admin",
      organizationId: 11,
      isSuperAdmin: false,
    });
    expect(context.experience).toBe("school-admin");
    expect(context.scope).toBe("organization");
  });

  it("does not infer admin scope from class or grade data", () => {
    const context = resolveExperience({
      role: "Admin",
      organizationId: 11,
      classId: 4,
      isSuperAdmin: false,
    });
    expect(context.experience).toBe("school-admin");
  });

  it("classifies an unknown or malformed role as unsupported, not as a learner", () => {
    ["", "  ", "Headmaster", "student", null, undefined].forEach((role) => {
      const context = resolveExperience({ role: role as string | null | undefined });
      expect(context.experience, String(role)).toBe("unsupported");
      expect(context.scope).toBe("unsupported");
      // Reward wording still fails closed, so no instant-reward copy can leak.
      expect(context.rewardMode).toBe("approval");
      expect(context.dataFault).toBe(false);
    });
  });

  it("reports an unsupported session through the shared helper", () => {
    expect(isUnsupportedExperience(resolveExperience({ role: "nonsense" }))).toBe(true);
    expect(
      isUnsupportedExperience(
        resolveExperience({ role: "Student", organizationId: null, classId: null }),
      ),
    ).toBe(false);
  });
});

describe("session flags and identity", () => {
  it("carries impersonation and preview through", () => {
    const context = resolveExperience({
      role: "Student",
      organizationId: null,
      classId: null,
      isImpersonating: true,
      isPreview: true,
    });
    expect(context.isImpersonating).toBe(true);
    expect(context.isPreview).toBe(true);
  });

  it("prefers the numeric account id over the email for the storage key", () => {
    expect(
      resolveExperience({ role: "Student", userId: 7, email: "a@b.c" }).accountKey,
    ).toBe("u7");
    expect(
      resolveExperience({ role: "Student", userId: null, email: "a@b.c" }).accountKey,
    ).toBe("e:a@b.c");
  });

  it("carries the raw account creation timestamp without reinterpreting it", () => {
    expect(
      resolveExperience({ role: "Student", accountCreatedAt: "2026-09-08T00:00:00Z" })
        .accountCreatedAt,
    ).toBe("2026-09-08T00:00:00Z");
    expect(resolveExperience({ role: "Student" }).accountCreatedAt).toBeNull();
  });

  it("defaults to Arabic and accepts English", () => {
    expect(resolveExperience({ role: "Student" }).locale).toBe("ar");
    expect(resolveExperience({ role: "Student", locale: "en" }).locale).toBe("en");
  });
});
