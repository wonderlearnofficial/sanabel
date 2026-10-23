import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider, useUserContext } from "../../../context/StudentUserProvider";
import { clearAllGuideProgress, createProgressStore } from "../progressStore";
import { clearClientSession } from "../../../utils/session";

// The identity half of Phase 2A: the account creation timestamp the server now
// sends has to reach the authenticated Student user, unparsed, exactly once.

const state = vi.hoisted(() => ({
  response: null as any,
}));

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

const studentProfile = (accountCreatedAt: unknown, over: Record<string, unknown> = {}) => ({
  status: 200,
  data: {
    data: {
      accountCreatedAt,
      student: {
        id: 26,
        organizationId: null,
        classId: null,
        xp: 10,
        seeders: 0,
        water: 0,
        treeProgress: 1,
        connectCode: "ABC123",
        user: {
          firstName: "Omar",
          lastName: "Ahmed",
          email: "omar@example.com",
          seenGuides: [],
          ...(over.user as Record<string, unknown> | undefined),
        },
      },
      treePoint: { water: 1, seeders: 1, stage: 1 },
      completedTasks: { date: "2026-09-09", taskIds: [] },
    },
  },
});

const Probe = () => {
  const { user } = useUserContext();
  return (
    <span data-testid="created">
      {(user as { accountCreatedAt?: string | null } | null)?.accountCreatedAt ?? "none"}
    </span>
  );
};

const renderIdentity = () =>
  render(
    <UserProvider>
      <Probe />
    </UserProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("token", "test-token");
  localStorage.setItem("role", "Student");
});

describe("account creation timestamp plumbing", () => {
  it("exposes the server's accountCreatedAt on the Student identity", async () => {
    state.response = studentProfile("2026-09-09T10:00:00.000Z");
    renderIdentity();
    await waitFor(() =>
      expect(screen.getByTestId("created")).toHaveTextContent(
        "2026-09-09T10:00:00.000Z",
      ),
    );
  });

  it("falls back to the nested user record when the top-level field is absent", async () => {
    state.response = studentProfile(undefined, {
      user: { createdAt: "2026-05-01T00:00:00.000Z" },
    });
    renderIdentity();
    await waitFor(() =>
      expect(screen.getByTestId("created")).toHaveTextContent(
        "2026-05-01T00:00:00.000Z",
      ),
    );
  });

  it("reports null rather than inventing a timestamp when the server sends none", async () => {
    state.response = studentProfile(null);
    renderIdentity();
    await waitFor(() =>
      expect(screen.getByTestId("created")).toHaveTextContent("none"),
    );
  });

  it("keeps the raw string, so only the eligibility module parses it", async () => {
    // Deliberately a non-normalised but valid instant: the provider must not
    // reformat or reinterpret it on the way through.
    state.response = studentProfile("2026-09-09T12:00:00+02:00");
    renderIdentity();
    await waitFor(() =>
      expect(screen.getByTestId("created")).toHaveTextContent(
        "2026-09-09T12:00:00+02:00",
      ),
    );
  });
});

describe("session cleanup", () => {
  it("drops every account's tutorial position on logout", () => {
    createProgressStore({ accountKey: "u7" }).save(
      { guideId: "g", version: 1, stepId: "s2", stepIndex: 1 },
      3,
    );
    createProgressStore({ accountKey: "u9" }).save(
      { guideId: "g", version: 1, stepId: "s2", stepIndex: 1 },
      3,
    );

    clearClientSession();

    expect(createProgressStore({ accountKey: "u7" }).load()).toBeNull();
    expect(createProgressStore({ accountKey: "u9" }).load()).toBeNull();
  });

  it("leaves durable seen state alone — signing out is not un-learning", () => {
    localStorage.setItem("seenGuides-u7", JSON.stringify(["solo-orientation:v1"]));
    clearAllGuideProgress();
    clearClientSession();
    expect(localStorage.getItem("seenGuides-u7")).toContain("solo-orientation:v1");
  });
});
