import { useCallback, useEffect, useState } from "react";
import { localStore } from "../../utils/safeStorage";
import { SHELL, SIDEBAR_STORAGE_KEY } from "./theme";

/**
 * Sidebar/shell layout state.
 *
 * Two distinct behaviours, chosen by viewport width:
 *   - Desktop (>= SHELL.drawerBreakpoint): the sidebar is docked and can be
 *     collapsed to an icon rail. The preference persists.
 *   - Below that: the sidebar is an overlay drawer, closed by default. Collapse
 *     is meaningless there, so the persisted preference is ignored rather than
 *     overwritten — widening the window restores the desktop choice.
 *
 * Storage is best-effort. `localStore` swallows quota and privacy-mode failures
 * and returns a fallback, so a browser that refuses to persist still gets a
 * working sidebar. Nothing here influences authorization.
 */
export interface AdminShellState {
  /** True when the viewport is narrow enough to use the overlay drawer. */
  isDrawerLayout: boolean;
  /** Desktop only: the sidebar is an icon rail. */
  isCollapsed: boolean;
  /** Drawer layout only: the overlay is open. */
  isDrawerOpen: boolean;
  /** Width to reserve for the docked sidebar; 0 in drawer layout. */
  sidebarWidth: number;
  /** Hamburger in drawer layout, collapse/expand on desktop. */
  toggleSidebar: () => void;
  closeDrawer: () => void;
  /** Call when a nav item is chosen, so the drawer dismisses itself. */
  handleNavigate: () => void;
}

const readStoredCollapsed = (): boolean =>
  localStore.getItem(SIDEBAR_STORAGE_KEY) === "true";

const matchesDrawerLayout = (): boolean =>
  typeof window !== "undefined" && window.innerWidth < SHELL.drawerBreakpoint;

export const useAdminShell = (): AdminShellState => {
  const [isDrawerLayout, setIsDrawerLayout] = useState(matchesDrawerLayout);
  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsed);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Track the breakpoint. `matchMedia` rather than a resize listener so this
  // fires once per crossing instead of on every pixel.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(`(max-width: ${SHELL.drawerBreakpoint - 1}px)`);
    const apply = (matches: boolean) => {
      setIsDrawerLayout(matches);
      // Leaving drawer layout must not leave a stale open overlay behind.
      if (!matches) setIsDrawerOpen(false);
    };
    apply(query.matches);
    const listener = (event: MediaQueryListEvent) => apply(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  // Escape closes the overlay, matching the panel's other dismissible layers.
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  const toggleSidebar = useCallback(() => {
    if (isDrawerLayout) {
      setIsDrawerOpen((open) => !open);
      return;
    }
    setIsCollapsed((collapsed) => {
      const next = !collapsed;
      localStore.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, [isDrawerLayout]);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleNavigate = useCallback(() => {
    if (isDrawerLayout) setIsDrawerOpen(false);
  }, [isDrawerLayout]);

  return {
    isDrawerLayout,
    isCollapsed,
    isDrawerOpen,
    sidebarWidth: isDrawerLayout
      ? 0
      : isCollapsed
      ? SHELL.sidebarCollapsed
      : SHELL.sidebarExpanded,
    toggleSidebar,
    closeDrawer,
    handleNavigate,
  };
};
