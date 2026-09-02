import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_GROUPS, findNavGroup, findNavItem, scopedAdminHiddenTabs } from "./navigation";
import { SHELL, SIDEBAR_STORAGE_KEY } from "./theme";
import { useAdminShell } from "./useAdminShell";
import { Sidebar } from "./components/Sidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ar" },
  }),
}));

vi.mock("../../guides/useAutoStartGuide", () => ({
  useAutoStartGuide: () => undefined,
}));

vi.mock("../../guides/GuideProvider", () => ({
  useGuide: () => ({ replayGuide: vi.fn() }),
}));

/**
 * Drives `window.innerWidth` and `matchMedia` together so the hook sees a
 * coherent viewport. jsdom implements neither by default.
 */
const setViewportWidth = (width: number) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: width < SHELL.drawerBreakpoint,
      media: query,
      onchange: null,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
};

describe("admin navigation model", () => {
  it("hides exactly the Super-Admin-only tabs from a School Admin", () => {
    // The pre-refactor shell hardcoded this list. It is now derived from the
    // nav tree, so this pins the derivation to the same three tabs.
    expect(scopedAdminHiddenTabs().sort()).toEqual(
      ["admins", "analytics", "organizations"].sort(),
    );
  });

  it("keeps every entity page reachable from the sidebar", () => {
    // `app_version` was in the Tab union with a working endpoint and a
    // 542-line component, but the sidebar never rendered a button for it, so
    // maintenance mode and force-update were unreachable. Guard against a
    // page going dark like that again.
    const reachable = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => item.tab),
    );
    for (const tab of [
      "users",
      "students",
      "teachers",
      "parents",
      "admins",
      "classes",
      "organizations",
      "grades",
      "scores",
      "history",
      "app_version",
      "analytics",
    ] as const) {
      expect(reachable).toContain(tab);
    }
  });

  it("gives every nav item a unique id", () => {
    const ids = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("badges only actionable queues, never population counts", () => {
    const badged = NAV_GROUPS.flatMap((group) =>
      group.items.filter((item) => item.badge),
    );
    expect(badged.map((item) => item.id)).toEqual(["analytics-approvals"]);
  });

  it("resolves an analytics section to its own item, not the first analytics page", () => {
    expect(findNavItem("analytics", "approvals")?.id).toBe("analytics-approvals");
    expect(findNavGroup("analytics", "approvals")?.id).toBe("analytics");
    expect(findNavItem("students")?.id).toBe("students");
  });
});

describe("useAdminShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("docks the sidebar and reserves its expanded width on desktop", () => {
    setViewportWidth(1440);
    const { result } = renderHook(() => useAdminShell());
    expect(result.current.isDrawerLayout).toBe(false);
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.sidebarWidth).toBe(SHELL.sidebarExpanded);
  });

  it("collapses to the rail width and persists the preference", () => {
    setViewportWidth(1440);
    const { result } = renderHook(() => useAdminShell());
    act(() => result.current.toggleSidebar());
    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.sidebarWidth).toBe(SHELL.sidebarCollapsed);
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");
  });

  it("restores a persisted collapsed preference on mount", () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    setViewportWidth(1440);
    const { result } = renderHook(() => useAdminShell());
    expect(result.current.isCollapsed).toBe(true);
  });

  it("still works when storage refuses to persist", () => {
    // Private-browsing and quota failures throw from setItem. `localStore`
    // swallows that, so the sidebar must keep toggling in memory.
    //
    // The whole accessor is replaced rather than spied on: jsdom's Storage is
    // proxy-backed, so an instance-level spy on setItem is not observed.
    setViewportWidth(1440);
    const realStorage = window.localStorage;
    const setItem = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem, removeItem: () => undefined },
    });

    try {
      const { result } = renderHook(() => useAdminShell());
      expect(() => act(() => result.current.toggleSidebar())).not.toThrow();
      expect(result.current.isCollapsed).toBe(true);
      expect(setItem).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: realStorage,
      });
    }
  });

  it("uses an overlay drawer below the breakpoint and reserves no width", () => {
    setViewportWidth(768);
    const { result } = renderHook(() => useAdminShell());
    expect(result.current.isDrawerLayout).toBe(true);
    expect(result.current.isDrawerOpen).toBe(false);
    // Nothing is reserved, so content is never squeezed by the sidebar.
    expect(result.current.sidebarWidth).toBe(0);
  });

  it("toggles the drawer rather than collapsing on a narrow viewport", () => {
    setViewportWidth(500);
    const { result } = renderHook(() => useAdminShell());
    act(() => result.current.toggleSidebar());
    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.isCollapsed).toBe(false);
    act(() => result.current.handleNavigate());
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("ignores a persisted collapse preference in drawer layout", () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    setViewportWidth(500);
    const { result } = renderHook(() => useAdminShell());
    // The value is still remembered for when the window widens again...
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");
    // ...but a drawer is never an icon rail, so no width is reserved.
    expect(result.current.sidebarWidth).toBe(0);
  });
});

describe("Sidebar", () => {
  const baseProps = {
    activeTab: "students" as const,
    onNavigate: vi.fn(),
    onLogout: vi.fn(),
    isDrawerLayout: false,
    isDrawerOpen: false,
    onToggle: vi.fn(),
    onCloseDrawer: vi.fn(),
  };

  it("omits Super-Admin-only groups entirely for a School Admin", () => {
    render(
      <Sidebar {...baseProps} isCollapsed={false} hiddenTabs={scopedAdminHiddenTabs()} />,
    );
    expect(screen.queryByText("admin.nav.group.analytics")).toBeNull();
    expect(screen.queryByText("admin.tab.admins")).toBeNull();
    expect(screen.queryByText("admin.tab.organizations")).toBeNull();
    // A scoped admin still gets their own pages.
    expect(screen.getByText("admin.tab.students")).toBeTruthy();
    expect(screen.getByText("admin.tab.classes")).toBeTruthy();
  });

  it("shows the analytics group to a Super Admin", () => {
    render(<Sidebar {...baseProps} isCollapsed={false} hiddenTabs={[]} />);
    expect(screen.getByText("admin.nav.group.analytics")).toBeTruthy();
    expect(screen.getByText("admin.tab.organizations")).toBeTruthy();
  });

  it("hides labels when collapsed but keeps every item accessible by name", () => {
    render(<Sidebar {...baseProps} isCollapsed hiddenTabs={[]} />);
    // No visible text label...
    expect(screen.queryByText("admin.tab.students")).toBeNull();
    // ...but the control still has an accessible name, from `title`.
    expect(screen.getByTitle("admin.tab.students")).toBeTruthy();
  });

  it("renders an actionable badge only when the queue is non-empty", () => {
    const { rerender } = render(
      <Sidebar
        {...baseProps}
        isCollapsed={false}
        hiddenTabs={[]}
        badges={{ pendingApprovals: 12 }}
      />,
    );
    expect(screen.getByText("12")).toBeTruthy();

    // An unknown count must not render as 0 — the platform genuinely does not
    // know it until the analytics request lands.
    rerender(
      <Sidebar
        {...baseProps}
        isCollapsed={false}
        hiddenTabs={[]}
        badges={{ pendingApprovals: null }}
      />,
    );
    expect(screen.queryByText("0")).toBeNull();

    rerender(
      <Sidebar
        {...baseProps}
        isCollapsed={false}
        hiddenTabs={[]}
        badges={{ pendingApprovals: 0 }}
      />,
    );
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders nothing while a closed drawer, so content is never overlapped", () => {
    const { container } = render(
      <Sidebar {...baseProps} isCollapsed={false} isDrawerLayout isDrawerOpen={false} />,
    );
    expect(container.querySelector("aside")).toBeNull();
  });

  it("renders the drawer panel when open", () => {
    render(
      <Sidebar {...baseProps} isCollapsed={false} isDrawerLayout isDrawerOpen />,
    );
    expect(screen.getByText("admin.tab.students")).toBeTruthy();
  });
});
