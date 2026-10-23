// Phase 0 P0 regression coverage for the current guide engine:
// impersonation must not write Student guide state, guide ids must resolve,
// off-route replay must not lock the engine, and one auto guide per route entry
// must not starve later routes.
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuideProvider, useGuide } from "./GuideProvider";
import { ALL_GUIDES } from "./guideConfigs";

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

vi.mock("../context/StudentUserProvider", () => ({
  useUserContext: () => ({ user: state.user }),
}));

const Harness = () => {
  const { activeGuide, requestGuide, replayGuide, finish, isGuideSeen } = useGuide();
  return (
    <div>
      <span data-testid="active">{activeGuide?.id ?? "none"}</span>
      <span data-testid="seen-tree">{String(isGuideSeen("student-tree"))}</span>
      <button type="button" onClick={() => requestGuide("student-tree")}>
        request-tree
      </button>
      <button type="button" onClick={() => requestGuide("student-medal")}>
        request-medal
      </button>
      <button
        type="button"
        data-testid="replay-home"
        data-result="pending"
        onClick={(event) => {
          const started = replayGuide("student-home");
          event.currentTarget.dataset.result = String(started);
        }}
      >
        replay-home
      </button>
      <button
        type="button"
        data-testid="replay-tree"
        data-result="pending"
        onClick={(event) => {
          const started = replayGuide("student-tree");
          event.currentTarget.dataset.result = String(started);
        }}
      >
        replay-tree
      </button>
      <button type="button" onClick={finish}>
        finish
      </button>
    </div>
  );
};

const renderHarness = () =>
  render(
    <GuideProvider>
      <Harness />
    </GuideProvider>,
  );

describe("guide state persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    state.patches = [];
    state.user = {
      id: 1,
      email: "student@example.com",
      role: "Student",
      classId: 4,
      seenGuides: [],
    };
    localStorage.setItem("token", "test-token");
    window.history.pushState({}, "", "/student/progress");
  });

  it("marks a guide seen for a normal Student session", () => {
    renderHarness();

    fireEvent.click(screen.getByText("request-tree"));
    expect(screen.getByTestId("active")).toHaveTextContent("student-tree");

    fireEvent.click(screen.getByText("finish"));

    expect(screen.getByTestId("active")).toHaveTextContent("none");
    expect(screen.getByTestId("seen-tree")).toHaveTextContent("true");
    expect(state.patches).toHaveLength(1);
    expect(state.patches[0].url).toContain("/users/seen-guides");
    expect(state.patches[0].body).toEqual({ guideId: "student-tree" });
    expect(
      localStorage.getItem("seenGuides-student@example.com"),
    ).toContain("student-tree");
  });

  it("never auto-starts or persists anything in an impersonated session", () => {
    localStorage.setItem("isImpersonated", "true");
    renderHarness();

    fireEvent.click(screen.getByText("request-tree"));
    expect(screen.getByTestId("active")).toHaveTextContent("none");

    // An admin may still look at a guide on purpose, but ending it must not
    // consume the real Student's onboarding.
    fireEvent.click(screen.getByTestId("replay-tree"));
    expect(screen.getByTestId("active")).toHaveTextContent("student-tree");
    fireEvent.click(screen.getByText("finish"));

    expect(state.patches).toHaveLength(0);
    expect(screen.getByTestId("seen-tree")).toHaveTextContent("false");
    expect(localStorage.getItem("seenGuides-student@example.com")).toBeNull();
  });
});

describe("replay safety", () => {
  beforeEach(() => {
    localStorage.clear();
    state.patches = [];
    state.user = {
      id: 1,
      email: "student@example.com",
      role: "Student",
      classId: 4,
      seenGuides: [],
    };
    window.history.pushState({}, "", "/student/settings/guides");
  });

  it("refuses a spotlight guide whose target is not on this page", () => {
    renderHarness();

    fireEvent.click(screen.getByTestId("replay-home"));

    expect(screen.getByTestId("replay-home").dataset.result).toBe("false");
    // The engine stays free: a stuck activeGuide blocks every later guide.
    expect(screen.getByTestId("active")).toHaveTextContent("none");
  });

  it("starts the same guide once its first target is on the page", () => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-guide-id", "daily-challenges");
    document.body.appendChild(anchor);

    try {
      renderHarness();
      fireEvent.click(screen.getByTestId("replay-home"));

      expect(screen.getByTestId("replay-home").dataset.result).toBe("true");
      expect(screen.getByTestId("active")).toHaveTextContent("student-home");
    } finally {
      anchor.remove();
    }
  });
});

describe("auto-start budget", () => {
  beforeEach(() => {
    localStorage.clear();
    state.patches = [];
    state.user = {
      id: 1,
      email: "student@example.com",
      role: "Student",
      classId: 4,
      seenGuides: [],
    };
    localStorage.setItem("token", "test-token");
    window.history.pushState({}, "", "/student/progress");
  });

  it("allows one automatic guide per route entry, not two", () => {
    renderHarness();

    fireEvent.click(screen.getByText("request-tree"));
    fireEvent.click(screen.getByText("finish"));

    // Same route, still-unseen guide: refused until the route is left.
    fireEvent.click(screen.getByText("request-medal"));
    expect(screen.getByTestId("active")).toHaveTextContent("none");
  });

  it("lets the next route start its own unseen guide", () => {
    renderHarness();

    fireEvent.click(screen.getByText("request-tree"));
    fireEvent.click(screen.getByText("finish"));

    window.history.pushState({}, "", "/student/home");
    fireEvent.click(screen.getByText("request-medal"));

    expect(screen.getByTestId("active")).toHaveTextContent("student-medal");
  });

  it("does not re-fire on re-render of the same route", () => {
    const { rerender } = renderHarness();

    fireEvent.click(screen.getByText("request-tree"));
    fireEvent.click(screen.getByText("finish"));

    rerender(
      <GuideProvider>
        <Harness />
      </GuideProvider>,
    );
    fireEvent.click(screen.getByText("request-tree"));

    // Already seen, and the route slot is spent: nothing reopens.
    expect(screen.getByTestId("active")).toHaveTextContent("none");
  });
});

describe("guide id reachability", () => {
  // Vitest runs from the client package root.
  const srcDir = path.resolve(process.cwd(), "src");

  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [full]
        : [];
    });

  const callSites = walk(srcDir).flatMap((file) => {
    const source = fs.readFileSync(file, "utf8");
    return [...source.matchAll(/useAutoStartGuide\(\s*"([^"]+)"/g)].map((match) => ({
      file: path.relative(srcDir, file).replace(/\\/g, "/"),
      guideId: match[1],
    }));
  });

  const registeredIds = ALL_GUIDES.map((guide) => guide.id);

  it("resolves every auto-start call site to a registered guide", () => {
    const unresolved = callSites.filter(
      (site) => !registeredIds.includes(site.guideId),
    );
    expect(unresolved).toEqual([]);
  });

  it("auto-starts the tree guide from the tree tab", () => {
    expect(
      callSites.filter(
        (site) => site.file === "pages/student/progress/ProgressTree.tsx",
      ),
    ).toEqual([
      { file: "pages/student/progress/ProgressTree.tsx", guideId: "student-tree" },
    ]);
  });

  it("auto-starts the medal guide from the level and medals tab", () => {
    expect(
      callSites.filter(
        (site) => site.file === "pages/student/progress/ProgressMedals.tsx",
      ),
    ).toEqual([
      { file: "pages/student/progress/ProgressMedals.tsx", guideId: "student-medal" },
    ]);
  });

  it("registers no guide that cannot be reached", () => {
    // `student-xp` had no call site and no screen of its own; it stays exported
    // for Tutorial V2 but is no longer an active, unreachable registration.
    expect(registeredIds).not.toContain("student-xp");
  });

  it("links the Student replay list from Settings", () => {
    const settings = fs.readFileSync(
      path.join(srcDir, "pages/student/profile/StudentSettings.tsx"),
      "utf8",
    );
    expect(settings).toContain("/student/settings/guides");
  });
});
