import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideProviderV2, useGuideV2 } from "../GuideProviderV2";
import { OverlayCoordinatorProvider } from "../OverlayCoordinator";
import {
  setDevAccountAgeOverride,
  setStudentRolloutOverride,
  setTutorialV2Override,
} from "../featureFlag";
import { notifyRouteEntry, resetRouteEntriesForTest } from "../routeEntry";
import { GuideRegistryEntry } from "../types";

// End-to-end rollout gating: the engine must withhold automatic first-time
// onboarding from accounts that existed before Tutorial V2 shipped, and must
// still let a person replay or preview a guide on such an account.

const ROLLOUT = "2026-09-08T00:00:00Z";
const BEFORE = "2026-03-08T00:00:00Z"; // six months earlier
const AFTER = "2026-09-09T10:00:00Z";

const state = vi.hoisted(() => ({
  user: null as any,
  patches: [] as { url: string; body: any }[],
}));

vi.mock("axios", () => ({
  default: {
    patch: (url: string, body: any) => {
      state.patches.push({ url, body });
      return Promise.resolve({ data: {} });
    },
  },
}));

vi.mock("../../../context/StudentUserProvider", () => ({
  useUserContext: () => ({ user: state.user }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "ar" } }),
}));

const orientation: GuideRegistryEntry = {
  id: "solo-orientation",
  version: 1,
  bumpPolicy: "new-users-only",
  experiences: ["solo"],
  route: "/student/home",
  autoTrigger: { kind: "route-enter" },
  prerequisites: [],
  priority: "orientation",
  steps: [{ id: "s1", titleKey: "أهلًا" }],
  replayable: true,
  persistence: "seen-on-complete",
  helpTopicId: "missions",
};

// Neutral id on purpose. Manual replay of a `solo-*` / `school-*` guide now
// runs through the Student content agent's replay sequence in
// GuideProviderV2; this file tests the rollout gate, not that sequence, so it
// exercises replay with an id that sequence does not claim.
const probeOrientation: GuideRegistryEntry = {
  ...orientation,
  id: "probe-orientation",
};

const contextual: GuideRegistryEntry = {
  ...orientation,
  id: "solo-shop-intro",
  bumpPolicy: "all",
  priority: "gameplay-concept",
};

const Probe = () => {
  const guides = useGuideV2();
  return (
    <div>
      <span data-testid="experience">{guides.context.experience}</span>
      <span data-testid="created">{guides.context.accountCreatedAt ?? "null"}</span>
      <span data-testid="active">{guides.active?.guide.id ?? "none"}</span>
      <span data-testid="origin">{guides.active?.origin ?? "none"}</span>
      <button type="button" onClick={guides.requestAutoStart}>
        request-auto
      </button>
      <span data-testid="step">{guides.active?.stepIndex ?? -1}</span>
      <button type="button" onClick={guides.advance}>
        next
      </button>
      <button type="button" onClick={guides.defer}>
        later
      </button>
      <button type="button" onClick={guides.complete}>
        finish
      </button>
      <button
        type="button"
        data-testid="replay"
        data-result="pending"
        onClick={(event) => {
          event.currentTarget.dataset.result = String(
            guides.replayGuide("probe-orientation"),
          );
        }}
      >
        replay
      </button>
      <button
        type="button"
        data-testid="preview"
        onClick={() => guides.previewGuide("probe-orientation")}
      >
        preview
      </button>
    </div>
  );
};

const soloAccount = (accountCreatedAt: string | null, over: Record<string, unknown> = {}) => ({
  id: 7,
  email: "solo@example.com",
  role: "Student",
  organizationId: null,
  classId: null,
  seenGuides: [],
  accountCreatedAt,
  ...over,
});

// Injected clock: the 90 s cooldown between automatic guides is real
// behaviour, so a test that starts a second guide steps past it deliberately.
const clock = { value: Date.parse("2026-09-10T09:00:00Z") };
const waitOutCooldown = () => {
  clock.value += 120_000;
};

const renderApp = (registry: GuideRegistryEntry[] = [orientation]) =>
  render(
    <OverlayCoordinatorProvider>
      <GuideProviderV2 registry={registry} now={() => clock.value}>
        <Probe />
      </GuideProviderV2>
    </OverlayCoordinatorProvider>,
  );

const active = () => screen.getByTestId("active").textContent;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  state.patches = [];
  state.user = soloAccount(AFTER);
  clock.value = Date.parse("2026-09-10T09:00:00Z");
  localStorage.setItem("token", "test-token");
  resetRouteEntriesForTest();
  setTutorialV2Override("on");
  setStudentRolloutOverride(ROLLOUT);
  setDevAccountAgeOverride(false);
  window.history.pushState({}, "", "/student/home");
  notifyRouteEntry("/student/home");
});

afterEach(() => {
  setTutorialV2Override(null);
  setStudentRolloutOverride(null);
  setDevAccountAgeOverride(false);
});

describe("existing accounts", () => {
  it("does not auto-start orientation for an account created before rollout", () => {
    state.user = soloAccount(BEFORE);
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
  });

  it("withholds it even when the account has no guide history at all", () => {
    // This is exactly the case the Phase 1 "no earlier version recorded"
    // approximation could not distinguish from a brand-new learner.
    state.user = soloAccount(BEFORE, { seenGuides: [] });
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });

  it("still offers a contextual bumpPolicy:all guide to that account", () => {
    state.user = soloAccount(BEFORE);
    renderApp([contextual]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("solo-shop-intro");
  });

  it("lets the learner replay orientation on purpose", () => {
    state.user = soloAccount(BEFORE);
    renderApp([probeOrientation]);
    fireEvent.click(screen.getByTestId("replay"));
    expect(screen.getByTestId("replay").dataset.result).toBe("true");
    expect(screen.getByTestId("origin")).toHaveTextContent("replay");

    fireEvent.click(screen.getByText("finish"));
    // A replay is not "having been onboarded".
    expect(state.patches).toEqual([]);
  });

  it("allows a preview on that account, persisting nothing", () => {
    state.user = soloAccount(BEFORE);
    renderApp([probeOrientation]);
    fireEvent.click(screen.getByTestId("preview"));
    expect(screen.getByTestId("origin")).toHaveTextContent("preview");
    fireEvent.click(screen.getByText("finish"));
    expect(state.patches).toEqual([]);
  });
});

describe("new accounts", () => {
  it("auto-starts orientation for an account created after rollout", () => {
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("solo-orientation");
    fireEvent.click(screen.getByText("finish"));
    expect(state.patches[0].body).toEqual({ guideId: "solo-orientation:v1" });
  });

  it("treats the cutoff instant itself as a new account", () => {
    state.user = soloAccount(ROLLOUT);
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("solo-orientation");
  });

  it("still respects legacy seen state for a new account", () => {
    // A post-rollout account that somehow carries the Phase 0 predecessor is
    // not taught the successor again.
    state.user = soloAccount(AFTER, { seenGuides: ["student-home"] });
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });
});

describe("first-success resume for an eligible account", () => {
  const flow: GuideRegistryEntry = {
    ...orientation,
    id: "probe-first-success",
    priority: "first-success",
    steps: [
      { id: "s1", titleKey: "أ" },
      { id: "s2", titleKey: "ب" },
      { id: "s3", titleKey: "ج" },
    ],
  };

  it("resumes where the learner stopped, still unseen", () => {
    renderApp([flow]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("probe-first-success");

    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("later"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);

    act(() => {
      notifyRouteEntry("/student/progress");
      notifyRouteEntry("/student/home");
    });
    waitOutCooldown();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("probe-first-success");
    expect(screen.getByTestId("step")).toHaveTextContent("1");
  });

  it("does not resume it for an account that predates rollout — it never starts", () => {
    state.user = soloAccount(BEFORE);
    renderApp([flow]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });
});

describe("unknown account age", () => {
  it("withholds first-time onboarding when the timestamp is missing", () => {
    state.user = soloAccount(null);
    renderApp();
    expect(screen.getByTestId("created")).toHaveTextContent("null");
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });

  it("withholds it when the timestamp is unparseable", () => {
    state.user = soloAccount("yesterday-ish");
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });

  it("keeps replay available in that state", () => {
    state.user = soloAccount(null);
    renderApp([probeOrientation]);
    fireEvent.click(screen.getByTestId("replay"));
    expect(active()).toBe("probe-orientation");
  });
});

describe("rollout not configured", () => {
  it("withholds age-gated onboarding until a rollout instant exists", () => {
    setStudentRolloutOverride(null);
    state.user = soloAccount(AFTER);
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });

  it("does not withhold contextual guides in that state", () => {
    setStudentRolloutOverride(null);
    renderApp([contextual]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("solo-shop-intro");
  });
});

describe("account switching on a shared device", () => {
  it("gates each account on its own creation time", () => {
    // Account A: created before rollout — no orientation.
    state.user = soloAccount(BEFORE, { id: 1, email: "a@example.com" });
    const view = renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
    view.unmount();

    // Account B on the same device: created after rollout — eligible.
    state.user = soloAccount(AFTER, { id: 2, email: "b@example.com" });
    act(() => {
      notifyRouteEntry("/student/progress");
      notifyRouteEntry("/student/home");
    });
    waitOutCooldown();
    const second = renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("solo-orientation");
    fireEvent.click(screen.getByText("finish"));
    expect(state.patches[0].body).toEqual({ guideId: "solo-orientation:v1" });
    second.unmount();

    // Account C: malformed timestamp — no orientation, and it inherits nothing
    // from B's completed run.
    state.patches = [];
    state.user = soloAccount("", { id: 3, email: "c@example.com" });
    act(() => {
      notifyRouteEntry("/student/progress");
      notifyRouteEntry("/student/home");
    });
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
  });

  it("keeps seen state keyed per account, not per device", () => {
    state.user = soloAccount(AFTER, { id: 2 });
    const view = renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    fireEvent.click(screen.getByText("finish"));
    expect(localStorage.getItem("seenGuides-u2")).toContain("solo-orientation:v1");
    view.unmount();

    state.user = soloAccount(AFTER, { id: 9, email: "other@example.com" });
    act(() => {
      notifyRouteEntry("/student/progress");
      notifyRouteEntry("/student/home");
    });
    waitOutCooldown();
    renderApp();
    // The other learner's completion must not suppress this one's orientation.
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("solo-orientation");
  });
});

describe("read-only sessions and unsupported identity", () => {
  it("never auto-starts while impersonating, even for a new account", () => {
    localStorage.setItem("isImpersonated", "true");
    renderApp();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
  });

  it("gives an unknown role no tutorial at all", () => {
    state.user = { ...soloAccount(AFTER), role: "Headmaster" };
    renderApp();
    expect(screen.getByTestId("experience")).toHaveTextContent("unsupported");
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
  });

  it("does not persist anything for an unknown role, even on replay", () => {
    state.user = { ...soloAccount(AFTER), role: undefined };
    renderApp();
    fireEvent.click(screen.getByTestId("replay"));
    // The engine is not enabled for an unsupported experience at all.
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
  });
});

describe("all four Student classifications with the gate active", () => {
  const cases: [string, number | null, number | null, string, string][] = [
    ["solo", null, null, "solo", "instant"],
    ["school with class", 11, 4, "school-student", "approval"],
    ["school without class", 11, null, "school-student", "approval"],
    ["class without organization", null, 4, "school-student", "approval"],
  ];

  cases.forEach(([name, organizationId, classId, experience]) => {
    it(`classifies ${name} independently of the rollout gate`, () => {
      state.user = soloAccount(AFTER, { organizationId, classId });
      renderApp([{ ...orientation, experiences: ["solo", "school-student"] }]);
      expect(screen.getByTestId("experience")).toHaveTextContent(experience);
      fireEvent.click(screen.getByText("request-auto"));
      // Eligible by age, and matched by experience: the gate does not change
      // classification, only whether onboarding may auto-run.
      expect(active()).toBe("solo-orientation");
    });
  });

  it("still withholds onboarding for those classifications on an old account", () => {
    cases.forEach(([, organizationId, classId]) => {
      state.patches = [];
      state.user = soloAccount(BEFORE, { organizationId, classId });
      const view = renderApp([
        { ...orientation, experiences: ["solo", "school-student"] },
      ]);
      fireEvent.click(screen.getByText("request-auto"));
      expect(active()).toBe("none");
      view.unmount();
      act(() => {
        notifyRouteEntry("/student/progress");
        notifyRouteEntry("/student/home");
      });
    });
  });
});
