// Route-entry QA for the auto-start budget. The budget must mean "one
// automatic guide per visit to a route", not "one guide per the last pathname
// that happened to ask for one" — the difference shows up when the route in
// between asks for nothing, which is most routes.
//
// Mirrors production wiring: GuideProvider above the router (it also wraps
// GuideOverlay, which lives outside IonReactRouter), GuideRouteWatcher inside.
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter, useHistory } from "react-router-dom";
import { GuideProvider, useGuide } from "./GuideProvider";
import GuideRouteWatcher from "./GuideRouteWatcher";

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

const Screen = () => {
  const { activeGuide, requestGuide, finish } = useGuide();
  const history = useHistory();
  return (
    <div>
      <span data-testid="active">{activeGuide?.id ?? "none"}</span>
      <span data-testid="path">{window.location.pathname}</span>
      <button type="button" onClick={() => requestGuide("student-tree")}>
        request-tree
      </button>
      <button type="button" onClick={() => requestGuide("student-medal")}>
        request-medal
      </button>
      <button type="button" onClick={() => requestGuide("student-stats")}>
        request-stats
      </button>
      <button type="button" onClick={finish}>
        finish
      </button>
      <button type="button" onClick={() => history.push("/student/home")}>
        go-home
      </button>
      <button type="button" onClick={() => history.push("/student/progress")}>
        go-progress
      </button>
      <button type="button" onClick={() => history.push("/student/settings")}>
        go-quiet-route
      </button>
    </div>
  );
};

// `watch: false` reproduces a provider with no navigation signal, which is what
// the dev-only screens outside the router get.
const renderApp = ({ watch = true }: { watch?: boolean } = {}) =>
  render(
    <GuideProvider>
      <BrowserRouter>
        {watch ? <GuideRouteWatcher /> : null}
        <Screen />
      </BrowserRouter>
    </GuideProvider>,
  );

const active = () => screen.getByTestId("active").textContent;
const click = (label: string) => fireEvent.click(screen.getByText(label));

const startAndFinish = (label: string, guideId: string) => {
  click(label);
  expect(active()).toBe(guideId);
  click("finish");
  expect(active()).toBe("none");
};

describe("automatic guide budget is per route entry", () => {
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
    window.history.pushState({}, "", "/student/home");
  });

  it("CASE A: returning through a route that has its own guide is a fresh entry", () => {
    renderApp();

    startAndFinish("request-tree", "student-tree");

    click("go-progress");
    startAndFinish("request-medal", "student-medal");

    click("go-home");
    click("request-stats");

    expect(active()).toBe("student-stats");
  });

  it("CASE B: returning through a route that requests nothing is a fresh entry", () => {
    renderApp();

    startAndFinish("request-tree", "student-tree");

    // The route in between asks for no guide at all, so nothing overwrites the
    // claim. Comparing pathnames at request time would read the return trip as
    // the same visit and refuse.
    click("go-quiet-route");
    click("go-home");
    click("request-medal");

    expect(active()).toBe("student-medal");
  });

  it("CASE C: twenty re-renders on one route start nothing more", () => {
    const view = renderApp();

    startAndFinish("request-tree", "student-tree");

    for (let attempt = 0; attempt < 20; attempt += 1) {
      view.rerender(
        <GuideProvider>
          <BrowserRouter>
            <GuideRouteWatcher />
            <Screen />
          </BrowserRouter>
        </GuideProvider>,
      );
      click("request-medal");
      expect(active()).toBe("none");
    }
  });

  it("CASE D: a watcher remount on the same pathname does not hand out a second guide", () => {
    const view = renderApp();

    startAndFinish("request-tree", "student-tree");

    // Watcher unmounts and mounts again — its effect re-runs with the same
    // pathname. That is not navigation and must not restore the slot.
    view.rerender(
      <GuideProvider>
        <BrowserRouter>
          <Screen />
        </BrowserRouter>
      </GuideProvider>,
    );
    view.rerender(
      <GuideProvider>
        <BrowserRouter>
          <GuideRouteWatcher />
          <Screen />
        </BrowserRouter>
      </GuideProvider>,
    );

    click("request-medal");

    expect(active()).toBe("none");
  });

  it("CASE E: A to B to A is a new entry for A even when B had no eligible guide", () => {
    renderApp();

    startAndFinish("request-tree", "student-tree");

    click("go-quiet-route");
    // B asks, but its only candidate is already seen, so nothing starts and no
    // claim is taken.
    click("request-tree");
    expect(active()).toBe("none");

    click("go-home");
    click("request-stats");

    expect(active()).toBe("student-stats");
  });

  it("still allows only one automatic guide inside a single entry", () => {
    renderApp();

    startAndFinish("request-tree", "student-tree");
    click("request-medal");

    expect(active()).toBe("none");
  });

  // The behaviour above depends on the watcher actually being mounted inside
  // the router. Without this check, deleting one line from App.tsx would
  // silently restore the CASE B / CASE E bug with every test still green.
  it("mounts the route watcher inside the app router", () => {
    const app = fs.readFileSync(
      path.resolve(process.cwd(), "src/App.tsx"),
      "utf8",
    );

    expect(app).toContain('from "./guides/GuideRouteWatcher"');

    const routerAt = app.indexOf("<IonReactRouter>");
    const outletAt = app.indexOf("<IonRouterOutlet>", routerAt);
    const watcherAt = app.indexOf("<GuideRouteWatcher />", routerAt);

    expect(routerAt).toBeGreaterThan(-1);
    expect(watcherAt).toBeGreaterThan(routerAt);
    expect(watcherAt).toBeLessThan(outletAt);
  });

  it("falls back to pathname comparison when no watcher reports navigation", () => {
    renderApp({ watch: false });

    startAndFinish("request-tree", "student-tree");
    click("request-medal");
    expect(active()).toBe("none");

    // A missing watcher must never mean "one guide for the whole session".
    click("go-progress");
    click("request-medal");
    expect(active()).toBe("student-medal");
  });
});
