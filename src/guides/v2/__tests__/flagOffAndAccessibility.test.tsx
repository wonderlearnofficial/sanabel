import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideProvider, useGuide } from "../../GuideProvider";
import { GuideProviderV2, useGuideV2 } from "../GuideProviderV2";
import GuideOverlayV2 from "../GuideOverlayV2";
import { OverlayCoordinatorProvider } from "../OverlayCoordinator";
import { setTutorialV2Override } from "../featureFlag";
import { notifyRouteEntry, resetRouteEntriesForTest } from "../routeEntry";
import { GuideRegistryEntry } from "../types";

const state = vi.hoisted(() => ({
  user: null as any,
  patches: [] as { url: string; body: any }[],
  language: "ar",
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
    i18n: { language: state.language },
  }),
}));

const entry = (over: Partial<GuideRegistryEntry> = {}): GuideRegistryEntry => ({
  id: "tour",
  version: 1,
  bumpPolicy: "all",
  experiences: ["solo"],
  route: "/student/home",
  autoTrigger: { kind: "route-enter" },
  prerequisites: [],
  priority: "route-tour",
  steps: [
    { id: "s1", titleKey: "الخطوة الأولى", descriptionKey: "شرح الخطوة" },
    { id: "s2", titleKey: "الخطوة الثانية" },
  ],
  replayable: true,
  persistence: "seen-on-complete",
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  state.patches = [];
  state.language = "ar";
  state.user = {
    id: 7,
    email: "solo@example.com",
    role: "Student",
    organizationId: null,
    classId: null,
    seenGuides: [],
  };
  localStorage.setItem("token", "test-token");
  resetRouteEntriesForTest();
  setTutorialV2Override(null);
  window.history.pushState({}, "", "/student/home");
});

afterEach(() => setTutorialV2Override(null));

// ---------------------------------------------------------------------------
// Flag off: the Phase 0 engine must behave exactly as before.
// ---------------------------------------------------------------------------

const LegacyProbe = () => {
  const { activeGuide, requestGuide, finish } = useGuide();
  return (
    <div>
      <span data-testid="legacy-active">{activeGuide?.id ?? "none"}</span>
      <button type="button" onClick={() => requestGuide("student-tree")}>
        legacy-request
      </button>
      <button type="button" onClick={finish}>
        legacy-finish
      </button>
    </div>
  );
};

describe("feature flag off preserves Phase 0", () => {
  it("still auto-starts and persists through the Phase 0 engine", () => {
    render(
      <GuideProvider>
        <LegacyProbe />
      </GuideProvider>,
    );

    fireEvent.click(screen.getByText("legacy-request"));
    expect(screen.getByTestId("legacy-active")).toHaveTextContent("student-tree");

    fireEvent.click(screen.getByText("legacy-finish"));
    expect(state.patches).toHaveLength(1);
    expect(state.patches[0].body).toEqual({ guideId: "student-tree" });
  });

  it("mounts no V2 overlay and reports V2 as disabled", () => {
    render(
      <OverlayCoordinatorProvider>
        <GuideProviderV2 registry={[entry()]}>
          <V2Probe />
          <GuideOverlayV2 />
        </GuideProviderV2>
      </OverlayCoordinatorProvider>,
    );
    expect(screen.getByTestId("enabled")).toHaveTextContent("false");
    fireEvent.click(screen.getByText("request-auto"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(state.patches).toEqual([]);
  });

  it("hands the experience over to V2 when the flag is on, so both never run", () => {
    setTutorialV2Override(["solo"]);
    render(
      <GuideProvider>
        <LegacyProbe />
      </GuideProvider>,
    );
    fireEvent.click(screen.getByText("legacy-request"));
    // The Phase 0 engine stands down for an experience V2 owns.
    expect(screen.getByTestId("legacy-active")).toHaveTextContent("none");
    expect(state.patches).toEqual([]);
  });

  it("leaves the Phase 0 engine in charge of experiences V2 has not taken", () => {
    setTutorialV2Override(["teacher"]);
    render(
      <GuideProvider>
        <LegacyProbe />
      </GuideProvider>,
    );
    fireEvent.click(screen.getByText("legacy-request"));
    expect(screen.getByTestId("legacy-active")).toHaveTextContent("student-tree");
  });
});

// ---------------------------------------------------------------------------
// Accessibility and direction.
// ---------------------------------------------------------------------------

function V2Probe() {
  const guides = useGuideV2();
  return (
    <div>
      <span data-testid="enabled">{String(guides.enabled)}</span>
      <span data-testid="active">{guides.active?.guide.id ?? "none"}</span>
      <span data-testid="step">{guides.active?.stepIndex ?? -1}</span>
      <button type="button" onClick={guides.requestAutoStart}>
        request-auto
      </button>
    </div>
  );
}

const renderV2 = (registry: GuideRegistryEntry[] = [entry()]) => {
  setTutorialV2Override("on");
  notifyRouteEntry("/student/home");
  const view = render(
    <OverlayCoordinatorProvider>
      <GuideProviderV2 registry={registry}>
        <V2Probe />
        <GuideOverlayV2 />
      </GuideProviderV2>
    </OverlayCoordinatorProvider>,
  );
  fireEvent.click(screen.getByText("request-auto"));
  return view;
};

describe("overlay accessibility", () => {
  it("exposes dialog semantics with a label and a description", () => {
    renderV2();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "guide2-title-s1");
    expect(dialog).toHaveAttribute("aria-describedby", "guide2-body-s1");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.getElementById("guide2-title-s1")).toHaveTextContent("الخطوة الأولى");
  });

  it("moves focus to the card and announces progress for screen readers", () => {
    renderV2();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    // The label is a shared i18n key (the mocked `t` returns the key itself),
    // so assert the announced position rather than one locale's wording.
    const announcement = screen.getByText(/1 \/ 2$/);
    expect(announcement).toHaveAttribute("aria-live", "polite");
    expect(announcement.textContent).not.toMatch(/[؀-ۿ]/);
  });

  it("does not trap focus when the step asks for a real tap", () => {
    const button = document.createElement("button");
    button.setAttribute("data-guide-id", "mission-action");
    // jsdom does not lay out, so the target is given a measurable box.
    button.getBoundingClientRect = () =>
      ({ top: 100, left: 40, width: 120, height: 44 }) as DOMRect;
    document.body.appendChild(button);
    try {
      renderV2([
        entry({
          steps: [
            { id: "s1", titleKey: "اضغط", targetId: "mission-action", advanceOn: "interaction" },
          ],
        }),
      ]);
      const dialog = screen.getByRole("dialog");
      // aria-modal would hide the very control the learner must reach.
      expect(dialog).not.toHaveAttribute("aria-modal");
      // A keyboard user is put on that control.
      expect(document.activeElement).toBe(button);
    } finally {
      button.remove();
    }
  });

  it("keeps every control at a 44px touch target", () => {
    renderV2();
    const dialog = screen.getByRole("dialog");
    dialog.querySelectorAll("button").forEach((button) => {
      expect(button.className).toMatch(/min-h-\[44px\]|h-11/);
    });
  });

  it("treats Escape as 'not now' for a multi-step flow", () => {
    renderV2();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("active")).toHaveTextContent("none");
    // Deferred, so nothing was recorded and the flow can resume.
    expect(state.patches).toEqual([]);
  });

  it("treats Escape as 'understood' for a single card", () => {
    renderV2([entry({ id: "single", steps: [{ id: "only", titleKey: "بطاقة" }] })]);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(state.patches).toHaveLength(1);
    expect(state.patches[0].body).toEqual({ guideId: "single:v1" });
  });
});

describe("direction", () => {
  it("renders the card RTL in Arabic", () => {
    renderV2();
    expect(screen.getByRole("dialog")).toHaveAttribute("dir", "rtl");
  });

  it("renders the card LTR in English", () => {
    state.language = "en";
    renderV2([entry({ id: "english" })]);
    expect(screen.getByRole("dialog")).toHaveAttribute("dir", "ltr");
  });

  it("places a targetless card in the centre, inside the viewport", () => {
    renderV2();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-guide-placement", "center");
    const left = Number.parseFloat(dialog.style.left);
    const top = Number.parseFloat(dialog.style.top);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + Number.parseFloat(dialog.style.width)).toBeLessThanOrEqual(
      window.innerWidth,
    );
  });
});
