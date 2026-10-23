import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideProviderV2, useGuideV2 } from "../GuideProviderV2";
import {
  OverlayCoordinatorProvider,
  useOverlayClaim,
} from "../OverlayCoordinator";
import GuideOverlayV2 from "../GuideOverlayV2";
import { setTutorialV2Override } from "../featureFlag";
import { notifyRouteEntry, resetRouteEntriesForTest } from "../routeEntry";
import { enterGuideView, leaveGuideView, resetGuideViewsForTest } from "../viewRegistry";
import { registerGuideNavigator } from "../navigator";
import { resetGuideViewSelectorsForTest, useGuideViewSelector } from "../GuideViewController";
import { registerHelpTopicOpener } from "../helpFallback";
import { GuideRegistryEntry, OVERLAY_TIER } from "../types";

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
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ar" },
  }),
}));

const entry = (over: Partial<GuideRegistryEntry>): GuideRegistryEntry => ({
  id: "tour",
  version: 1,
  bumpPolicy: "all",
  experiences: ["solo"],
  route: "/student/home",
  autoTrigger: { kind: "route-enter" },
  prerequisites: [],
  priority: "route-tour",
  steps: [{ id: "s1", titleKey: "شرح" }],
  replayable: true,
  persistence: "seen-on-complete",
  helpTopicId: "missions",
  ...over,
});

const Probe: React.FC = () => {
  const guides = useGuideV2();
  return (
    <div>
      <span data-testid="enabled">{String(guides.enabled)}</span>
      <span data-testid="experience">{guides.context.experience}</span>
      <span data-testid="reward">{guides.context.rewardMode}</span>
      <span data-testid="active">{guides.active?.guide.id ?? "none"}</span>
      <span data-testid="step">{guides.active?.stepIndex ?? -1}</span>
      <span data-testid="origin">{guides.active?.origin ?? "none"}</span>
      <button type="button" onClick={guides.requestAutoStart}>
        request-auto
      </button>
      <button type="button" onClick={guides.advance}>
        next
      </button>
      <button type="button" onClick={guides.complete}>
        finish
      </button>
      <button type="button" onClick={guides.defer}>
        later
      </button>
      <button
        type="button"
        data-testid="replay"
        data-result="pending"
        onClick={(event) => {
          event.currentTarget.dataset.result = String(guides.replayGuide("tour"));
        }}
      >
        replay
      </button>
      <button
        type="button"
        data-testid="preview"
        data-result="pending"
        onClick={(event) => {
          event.currentTarget.dataset.result = String(guides.previewGuide("tour"));
        }}
      >
        preview
      </button>
    </div>
  );
};

const Blocker: React.FC<{ open: boolean }> = ({ open }) => {
  useOverlayClaim(open, OVERLAY_TIER.blocking, "permissions-test");
  return null;
};

const clock = { value: 1_000_000 };
const now = () => clock.value;
/** Steps past the 90 s cooldown between two automatic guides. */
const waitOutCooldown = () => {
  clock.value += 120_000;
};

const renderApp = (
  registry: GuideRegistryEntry[],
  { blocking = false, extra = null }: { blocking?: boolean; extra?: React.ReactNode } = {},
) =>
  render(
    <OverlayCoordinatorProvider>
      <Blocker open={blocking} />
      <GuideProviderV2 registry={registry} now={now}>
        <Probe />
        <GuideOverlayV2 />
        {extra}
      </GuideProviderV2>
    </OverlayCoordinatorProvider>,
  );

const active = () => screen.getByTestId("active").textContent;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  state.patches = [];
  state.user = {
    id: 7,
    email: "solo@example.com",
    role: "Student",
    organizationId: null,
    classId: null,
    seenGuides: [],
    xp: 0,
  };
  localStorage.setItem("token", "test-token");
  clock.value = 1_000_000;
  resetRouteEntriesForTest();
  resetGuideViewsForTest();
  resetGuideViewSelectorsForTest();
  registerGuideNavigator(null);
  registerHelpTopicOpener(null);
  setTutorialV2Override("on");
  window.history.pushState({}, "", "/student/home");
  notifyRouteEntry("/student/home");
});

afterEach(() => {
  setTutorialV2Override(null);
});

describe("feature flag", () => {
  it("is inert when off: nothing enabled, nothing started", () => {
    setTutorialV2Override("off");
    renderApp([entry({})]);
    expect(screen.getByTestId("enabled")).toHaveTextContent("false");
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
  });

  it("can be enabled for one experience only", () => {
    setTutorialV2Override(["teacher"]);
    renderApp([entry({})]);
    // The session is Solo, so a Teacher-only rollout leaves it on Phase 0.
    expect(screen.getByTestId("enabled")).toHaveTextContent("false");
  });

  it("runs for the enabled experience", () => {
    setTutorialV2Override(["solo"]);
    renderApp([entry({})]);
    expect(screen.getByTestId("enabled")).toHaveTextContent("true");
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("tour");
  });
});

describe("experience wiring", () => {
  it("resolves reward mode from organization membership, not class", () => {
    state.user = { ...state.user, organizationId: 11, classId: null };
    renderApp([entry({ experiences: ["school-student"] })]);
    expect(screen.getByTestId("experience")).toHaveTextContent("school-student");
    expect(screen.getByTestId("reward")).toHaveTextContent("approval");
  });

  it("selects step copy by reward mode", () => {
    state.user = { ...state.user, organizationId: 11, classId: 4 };
    renderApp([
      entry({
        experiences: ["school-student"],
        steps: [
          {
            id: "s1",
            titleKey: "default-title",
            rewardModeCopy: {
              instant: { titleKey: "instant-title" },
              approval: { titleKey: "approval-title" },
            },
          },
        ],
      }),
    ]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(screen.getByRole("dialog")).toHaveTextContent("approval-title");
    expect(screen.getByRole("dialog")).not.toHaveTextContent("instant-title");
  });
});

describe("auto start, budget and persistence", () => {
  it("starts one guide and records it on completion", () => {
    renderApp([entry({})]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("tour");
    expect(screen.getByTestId("origin")).toHaveTextContent("auto");

    fireEvent.click(screen.getByText("finish"));
    expect(active()).toBe("none");
    expect(state.patches).toHaveLength(1);
    expect(state.patches[0].body).toEqual({ guideId: "tour:v1" });
  });

  it("spends one slot per route entry and frees it on the next entry", () => {
    renderApp([entry({}), entry({ id: "second" })]);
    fireEvent.click(screen.getByText("request-auto"));
    fireEvent.click(screen.getByText("finish"));

    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");

    act(() => {
      notifyRouteEntry("/student/progress");
      notifyRouteEntry("/student/home");
    });
    waitOutCooldown();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("second");
  });

  it("does not re-offer a guide the account already saw, including via a legacy id", () => {
    state.user = { ...state.user, seenGuides: ["student-shop"] };
    renderApp([entry({ id: "solo-shop-intro" })]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });

  // Resume is scoped to first-success flows (docs/TUTORIAL_V2_DESIGN.md §31);
  // a contextual guide restarts, which is what this asserts. First-success
  // resume is covered in rolloutGate.test.tsx, where the account is age-eligible.
  it("keeps a deferred contextual guide unseen, and restarts it", () => {
    renderApp([
      entry({
        steps: [
          { id: "s1", titleKey: "a" },
          { id: "s2", titleKey: "b" },
          { id: "s3", titleKey: "c" },
        ],
      }),
    ]);
    fireEvent.click(screen.getByText("request-auto"));
    fireEvent.click(screen.getByText("next"));
    expect(screen.getByTestId("step")).toHaveTextContent("1");

    fireEvent.click(screen.getByText("later"));
    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);

    act(() => {
      notifyRouteEntry("/student/progress");
      notifyRouteEntry("/student/home");
    });
    waitOutCooldown();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("tour");
    expect(screen.getByTestId("step")).toHaveTextContent("0");
  });
});

describe("view keys drive eligibility", () => {
  const treeGuide = entry({
    id: "tree",
    route: "/student/progress",
    view: "student.progress.tree",
    replayTarget: { route: "/student/progress", view: "student.progress.tree" },
  });
  const levelGuide = entry({
    id: "level",
    route: "/student/progress",
    view: "student.progress.level",
    replayTarget: { route: "/student/progress", view: "student.progress.level" },
  });

  it("starts the guide belonging to the mounted view only", () => {
    window.history.pushState({}, "", "/student/progress");
    act(() => notifyRouteEntry("/student/progress"));
    renderApp([treeGuide, levelGuide]);

    act(() => enterGuideView("student.progress.level"));
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("level");

    fireEvent.click(screen.getByText("finish"));
    act(() => {
      leaveGuideView("student.progress.level");
      enterGuideView("student.progress.tree");
      notifyRouteEntry("/student/home");
      notifyRouteEntry("/student/progress");
    });
    waitOutCooldown();
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("tree");
  });
});

describe("manual replay", () => {
  it("refuses a guide whose spotlight is not on this page and offers help", () => {
    const opener = vi.fn().mockReturnValue(true);
    registerHelpTopicOpener(opener);
    renderApp([entry({ steps: [{ id: "s1", titleKey: "t", targetId: "shop-water" }] })]);

    fireEvent.click(screen.getByTestId("replay"));
    expect(screen.getByTestId("replay").dataset.result).toBe("false");
    expect(active()).toBe("none");
    expect(opener).toHaveBeenCalledWith("missions");
  });

  it("runs once the target exists, and never records a replay as seen", () => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-guide-id", "shop-water");
    document.body.appendChild(anchor);
    try {
      renderApp([entry({ steps: [{ id: "s1", titleKey: "t", targetId: "shop-water" }] })]);
      fireEvent.click(screen.getByTestId("replay"));
      expect(screen.getByTestId("replay").dataset.result).toBe("true");
      expect(screen.getByTestId("origin")).toHaveTextContent("replay");

      fireEvent.click(screen.getByText("finish"));
      expect(state.patches).toEqual([]);
    } finally {
      anchor.remove();
    }
  });

  it("ignores the automatic budget", () => {
    renderApp([entry({})]);
    fireEvent.click(screen.getByText("request-auto"));
    fireEvent.click(screen.getByText("finish"));
    // The route entry's slot is spent and a cooldown is running.
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");

    fireEvent.click(screen.getByTestId("replay"));
    expect(active()).toBe("tour");
    expect(screen.getByTestId("origin")).toHaveTextContent("replay");
  });

  it("navigates to the guide's route before starting", () => {
    const navigate = vi.fn();
    registerGuideNavigator(navigate);
    window.history.pushState({}, "", "/student/settings");
    act(() => notifyRouteEntry("/student/settings"));

    renderApp([entry({})]);
    fireEvent.click(screen.getByTestId("replay"));
    expect(navigate).toHaveBeenCalledWith("/student/home");
  });

  it("asks the page to select a view before starting a view-scoped guide", () => {
    const selectTree = vi.fn();
    const Screen = () => {
      useGuideViewSelector({ "student.progress.tree": selectTree });
      return null;
    };
    const navigate = vi.fn();
    registerGuideNavigator(navigate);
    window.history.pushState({}, "", "/student/progress");
    act(() => notifyRouteEntry("/student/progress"));

    renderApp(
      [
        entry({
          route: "/student/progress",
          view: "student.progress.tree",
          replayTarget: { route: "/student/progress", view: "student.progress.tree" },
        }),
      ],
      { extra: <Screen /> },
    );

    fireEvent.click(screen.getByTestId("replay"));
    expect(selectTree).toHaveBeenCalled();
    expect(active()).toBe("tour");
  });

  it("refuses when no page can show the requested view", () => {
    window.history.pushState({}, "", "/student/progress");
    act(() => notifyRouteEntry("/student/progress"));
    renderApp([
      entry({
        route: "/student/progress",
        view: "student.progress.tree",
        replayTarget: { route: "/student/progress", view: "student.progress.tree" },
      }),
    ]);
    fireEvent.click(screen.getByTestId("replay"));
    expect(screen.getByTestId("replay").dataset.result).toBe("false");
    expect(active()).toBe("none");
  });
});

describe("read-only sessions", () => {
  it("never auto-starts or persists while impersonating", () => {
    localStorage.setItem("isImpersonated", "true");
    renderApp([entry({})]);
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");

    // An admin may still open a guide deliberately; ending it writes nothing.
    fireEvent.click(screen.getByTestId("replay"));
    expect(active()).toBe("tour");
    fireEvent.click(screen.getByText("finish"));
    expect(state.patches).toEqual([]);
  });

  it("runs a preview that persists nothing", () => {
    renderApp([entry({})]);
    fireEvent.click(screen.getByTestId("preview"));
    expect(screen.getByTestId("origin")).toHaveTextContent("preview");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-guide-preview", "true");

    fireEvent.click(screen.getByText("finish"));
    expect(state.patches).toEqual([]);
    expect(localStorage.getItem("seenGuides-u7")).toBeNull();
  });
});

describe("overlay priority", () => {
  it("does not start a guide while a blocking overlay owns the screen", () => {
    renderApp([entry({})], { blocking: true });
    fireEvent.click(screen.getByText("request-auto"));
    expect(active()).toBe("none");
  });

  it("stands a guide down when a blocking overlay appears, unseen and resumable", () => {
    const view = renderApp([
      entry({
        steps: [
          { id: "s1", titleKey: "a" },
          { id: "s2", titleKey: "b" },
        ],
      }),
    ]);
    fireEvent.click(screen.getByText("request-auto"));
    fireEvent.click(screen.getByText("next"));
    expect(active()).toBe("tour");

    view.rerender(
      <OverlayCoordinatorProvider>
        <Blocker open />
        <GuideProviderV2 registry={[entry({ steps: [{ id: "s1", titleKey: "a" }, { id: "s2", titleKey: "b" }] })]}>
          <Probe />
          <GuideOverlayV2 />
        </GuideProviderV2>
      </OverlayCoordinatorProvider>,
    );

    expect(active()).toBe("none");
    expect(state.patches).toEqual([]);
    expect(screen.queryAllByRole("dialog")).toHaveLength(0);
  });

  it("renders at most one guide dialog", () => {
    renderApp([entry({}), entry({ id: "second", priority: "tip" })]);
    fireEvent.click(screen.getByText("request-auto"));
    fireEvent.click(screen.getByText("request-auto"));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});

describe("missing target safety", () => {
  it("parks instead of hanging, and does not mark the guide seen", async () => {
    vi.useFakeTimers();
    try {
      renderApp([
        entry({
          steps: [
            {
              id: "s1",
              titleKey: "t",
              targetId: "shop-water",
              advanceOn: "interaction",
            },
          ],
        }),
      ]);
      fireEvent.click(screen.getByText("request-auto"));
      // Started, but the element does not exist, so nothing is rendered yet.
      expect(active()).toBe("tour");
      expect(screen.queryAllByRole("dialog")).toHaveLength(0);

      await act(async () => {
        vi.advanceTimersByTime(9_000);
      });

      expect(active()).toBe("none");
      expect(state.patches).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows a centred card when the step opts into that fallback", async () => {
    vi.useFakeTimers();
    try {
      renderApp([
        entry({
          steps: [
            {
              id: "s1",
              titleKey: "centred-copy",
              targetId: "shop-water",
              onMissingTarget: "center",
            },
          ],
        }),
      ]);
      fireEvent.click(screen.getByText("request-auto"));
      await act(async () => {
        vi.advanceTimersByTime(5_100);
      });

      expect(active()).toBe("tour");
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveTextContent("centred-copy");
      expect(dialog).toHaveAttribute("data-guide-placement", "center");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("interaction steps", () => {
  it("advances only when the real control is used, and never acts for the user", () => {
    const button = document.createElement("button");
    button.setAttribute("data-guide-id", "mission-action");
    const clicks: string[] = [];
    button.addEventListener("click", () => clicks.push("real"));
    document.body.appendChild(button);

    try {
      renderApp([
        entry({
          steps: [
            { id: "s1", titleKey: "tap", targetId: "mission-action", advanceOn: "interaction" },
            { id: "s2", titleKey: "done" },
          ],
        }),
      ]);
      fireEvent.click(screen.getByText("request-auto"));
      expect(screen.getByTestId("step")).toHaveTextContent("0");
      // The guide performs no mutation of its own.
      expect(clicks).toEqual([]);

      fireEvent.click(button);
      expect(clicks).toEqual(["real"]);
      expect(screen.getByTestId("step")).toHaveTextContent("1");
    } finally {
      button.remove();
    }
  });
});
