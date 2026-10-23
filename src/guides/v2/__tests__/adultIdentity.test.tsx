import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider, useUserContext } from "../../../context/StudentUserProvider";
import { rolloutAtFor, setRolloutOverrideFor } from "../featureFlag";
import { isGuideEligibleForAccount } from "../eligibility";

// Phase 3C: the Teacher and Parent identities must carry the same account-age
// field as the Student identity, raw, so Tutorial V2 eligibility has one parser
// and adults are gated on their own rollout date.

const state = vi.hoisted(() => ({ response: null as any }));

vi.mock("axios", () => ({
  default: {
    get: () => Promise.resolve(state.response),
    request: () => Promise.resolve({ status: 200, data: {} }),
    post: () => Promise.resolve({ status: 200, data: {} }),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "ar" } }),
}));

vi.mock("../../../utils/AudioManager", () => ({
  AudioManager: { play: vi.fn(), unlock: vi.fn() },
}));

/** Shape of `GET /teachers/teacher-data` and `GET /parents/parent-data`. */
const adultProfile = (
  accountCreatedAt: unknown,
  { userCreatedAt, organizationId }: { userCreatedAt?: unknown; organizationId?: number } = {},
) => ({
  status: 200,
  data: {
    data: {
      id: 9,
      organizationId,
      accountCreatedAt,
      user: {
        firstName: "Omar",
        lastName: "Ahmed",
        email: "omar@example.com",
        profileImg: null,
        gender: "male",
        dateOfBirth: "1990-01-01",
        isAccess: true,
        seenGuides: [],
        ...(userCreatedAt === undefined ? {} : { createdAt: userCreatedAt }),
      },
    },
  },
});

const Probe = () => {
  const { user } = useUserContext();
  return (
    <div>
      <span data-testid="role">{user?.role ?? "none"}</span>
      <span data-testid="created">
        {(user as { accountCreatedAt?: string | null } | null)?.accountCreatedAt ?? "none"}
      </span>
    </div>
  );
};

const renderAs = (role: "Teacher" | "Parent") => {
  localStorage.setItem("role", role);
  return render(
    <UserProvider>
      <Probe />
    </UserProvider>,
  );
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("token", "test-token");
});

describe("adult identity carries account age", () => {
  (["Teacher", "Parent"] as const).forEach((role) => {
    it(`exposes accountCreatedAt for a ${role}`, async () => {
      state.response = adultProfile("2026-04-17T06:30:00.000Z", { organizationId: 11 });
      renderAs(role);
      await waitFor(() =>
        expect(screen.getByTestId("created")).toHaveTextContent(
          "2026-04-17T06:30:00.000Z",
        ),
      );
      expect(screen.getByTestId("role")).toHaveTextContent(role);
    });

    it(`falls back to the nested user record for a ${role}`, async () => {
      state.response = adultProfile(undefined, {
        userCreatedAt: "2026-01-05T09:00:00.000Z",
      });
      renderAs(role);
      await waitFor(() =>
        expect(screen.getByTestId("created")).toHaveTextContent(
          "2026-01-05T09:00:00.000Z",
        ),
      );
    });

    it(`reports null rather than a guess for a ${role} with no timestamp`, async () => {
      state.response = adultProfile(null);
      renderAs(role);
      await waitFor(() =>
        expect(screen.getByTestId("created")).toHaveTextContent("none"),
      );
    });

    it(`keeps the value raw for a ${role}, so only eligibility parses it`, async () => {
      state.response = adultProfile("2026-04-17T08:30:00+02:00");
      renderAs(role);
      await waitFor(() =>
        expect(screen.getByTestId("created")).toHaveTextContent(
          "2026-04-17T08:30:00+02:00",
        ),
      );
    });
  });

  it("does not leak one account's identity into the next session", async () => {
    state.response = adultProfile("2026-04-17T06:30:00.000Z");
    const view = renderAs("Teacher");
    await waitFor(() =>
      expect(screen.getByTestId("created")).toHaveTextContent("2026-04-17"),
    );
    view.unmount();

    localStorage.clear();
    localStorage.setItem("token", "another-token");
    state.response = adultProfile(null);
    renderAs("Parent");
    await waitFor(() =>
      expect(screen.getByTestId("created")).toHaveTextContent("none"),
    );
  });
});

describe("per-audience rollout configuration", () => {
  beforeEach(() => {
    (["solo", "school-student", "teacher", "parent"] as const).forEach((experience) =>
      setRolloutOverrideFor(experience, null),
    );
  });

  it("keeps each audience on its own instant", () => {
    setRolloutOverrideFor("teacher", "2026-10-01T00:00:00Z");
    expect(rolloutAtFor("teacher")).toBe("2026-10-01T00:00:00Z");
    // Setting the Teacher date must not roll out anyone else.
    expect(rolloutAtFor("parent")).toBeNull();
    expect(rolloutAtFor("solo")).toBeNull();
  });

  it("shares one instant across the two Student experiences", () => {
    setRolloutOverrideFor("solo", "2026-09-08T00:00:00Z");
    expect(rolloutAtFor("school-student")).toBe("2026-09-08T00:00:00Z");
  });

  it("returns null for audiences with no rollout key yet", () => {
    expect(rolloutAtFor("school-admin")).toBeNull();
    expect(rolloutAtFor("super-admin")).toBeNull();
    expect(rolloutAtFor("unsupported")).toBeNull();
    expect(rolloutAtFor(null)).toBeNull();
  });

  it("gates an adult account against the adult instant", () => {
    setRolloutOverrideFor("teacher", "2026-10-01T00:00:00Z");
    const guide = {
      id: "teacher-orientation",
      bumpPolicy: "new-users-only" as const,
      priority: "orientation" as const,
    };

    expect(
      isGuideEligibleForAccount({
        guide,
        accountCreatedAt: "2026-05-01T00:00:00Z",
        rolloutAt: rolloutAtFor("teacher"),
      }).eligible,
    ).toBe(false);

    expect(
      isGuideEligibleForAccount({
        guide,
        accountCreatedAt: "2026-10-02T00:00:00Z",
        rolloutAt: rolloutAtFor("teacher"),
      }).eligible,
    ).toBe(true);

    // With no Parent date configured, Parent onboarding stays withheld even for
    // a brand-new account — the safe direction.
    expect(
      isGuideEligibleForAccount({
        guide: { ...guide, id: "parent-orientation" },
        accountCreatedAt: "2026-10-02T00:00:00Z",
        rolloutAt: rolloutAtFor("parent"),
      }).reason,
    ).toBe("rollout-not-configured");
  });
});
