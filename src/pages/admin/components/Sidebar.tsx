import React from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaBuilding,
  FaChalkboardTeacher,
  FaChartLine,
  FaChild,
  FaClipboardCheck,
  FaGraduationCap,
  FaHistory,
  FaMobileAlt,
  FaQuestionCircle,
  FaRegCheckSquare,
  FaSchool,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTasks,
  FaTrophy,
  FaUserFriends,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { useAutoStartGuide } from "../../../guides/useAutoStartGuide";
import { useGuide } from "../../../guides/GuideProvider";
import {
  AnalyticsSection,
  NavGroup,
  NavIcon,
  NavItem,
  NAV_GROUPS,
  Tab,
} from "../navigation";
import { BRAND, RADIUS, SHADOW, SHELL, cx } from "../theme";
import { Tooltip } from "./ui/Tooltip";

const ICONS: Record<NavIcon, React.ReactNode> = {
  dashboard: <FaTachometerAlt size={15} />,
  users: <FaUsers size={15} />,
  student: <FaChild size={15} />,
  teacher: <FaChalkboardTeacher size={15} />,
  parent: <FaUserFriends size={15} />,
  shield: <FaUserShield size={15} />,
  school: <FaBuilding size={15} />,
  class: <FaSchool size={15} />,
  grade: <FaGraduationCap size={15} />,
  trophy: <FaTrophy size={15} />,
  history: <FaHistory size={15} />,
  chart: <FaChartLine size={15} />,
  mission: <FaTasks size={15} />,
  approval: <FaClipboardCheck size={15} />,
  assignment: <FaRegCheckSquare size={15} />,
  organization: <FaBuilding size={15} />,
  app: <FaMobileAlt size={15} />,
};

/**
 * Actionable counts only. A badge means "there is a queue here"; it never
 * restates a population size, because a permanent "23 users" chip trains the
 * admin to ignore every badge in the rail.
 *
 * `null` = not yet loaded or not measurable. It renders nothing rather than 0.
 */
export interface SidebarBadges {
  pendingApprovals?: number | null;
}

export interface SidebarProps {
  activeTab: Tab;
  activeSection?: AnalyticsSection;
  onNavigate: (item: NavItem) => void;
  onLogout: () => void;
  badges?: SidebarBadges;
  /** Tabs to omit entirely, e.g. Super-Admin-only pages for a School Admin. */
  hiddenTabs?: Tab[];
  /** Desktop: rail mode. */
  isCollapsed: boolean;
  /** Viewport is narrow, so the sidebar is an overlay rather than docked. */
  isDrawerLayout: boolean;
  isDrawerOpen: boolean;
  onToggle: () => void;
  onCloseDrawer: () => void;
}

const resolveBadge = (
  item: NavItem,
  badges: SidebarBadges | undefined,
): number | null => {
  if (!item.badge || !badges) return null;
  const value = badges[item.badge];
  return typeof value === "number" && value > 0 ? value : null;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activeSection,
  onNavigate,
  onLogout,
  badges,
  hiddenTabs = [],
  isCollapsed,
  isDrawerLayout,
  isDrawerOpen,
  onToggle,
  onCloseDrawer,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { replayGuide } = useGuide();
  useAutoStartGuide("admin-home", true);

  // The rail only collapses on desktop. Inside the overlay the sidebar is
  // always full width, because an icon rail in a drawer helps nobody.
  const showLabels = isDrawerLayout || !isCollapsed;

  const visibleGroups: NavGroup[] = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !hiddenTabs.includes(item.tab)),
  })).filter((group) => group.items.length > 0);

  const isItemActive = (item: NavItem): boolean => {
    if (item.tab !== activeTab) return false;
    if (item.section) return item.section === activeSection;
    return true;
  };

  const renderItem = (item: NavItem) => {
    const active = isItemActive(item);
    const label = t(item.labelKey);
    const badge = resolveBadge(item, badges);

    return (
      <Tooltip key={item.id} label={label} enabled={!showLabels}>
        <button
          type="button"
          onClick={() => onNavigate(item)}
          aria-current={active ? "page" : undefined}
          title={showLabels ? undefined : label}
          className={cx(
            "relative flex items-center w-full gap-3 py-2.5 transition-colors",
            RADIUS.sm,
            showLabels ? "px-3 text-start" : "px-0 justify-center",
            active
              ? "bg-white/10 text-white font-semibold"
              : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
          )}
        >
          {active && (
            <motion.span
              layoutId="admin-sidebar-active"
              className="absolute inset-y-1.5 start-0 w-[3px] rounded-full"
              style={{ backgroundColor: BRAND.primary }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          <span
            className={cx(
              "relative flex items-center justify-center w-7 h-7 shrink-0 transition-colors",
              RADIUS.sm,
              active ? "bg-white/10" : "bg-white/5",
            )}
            style={active ? { color: BRAND.primary } : undefined}
          >
            {ICONS[item.icon]}
            {/* Collapsed rail has no room for a number, so the queue becomes a
                dot. The count itself is still read out by the label below. */}
            {badge !== null && !showLabels && (
              <span
                className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900"
                aria-hidden="true"
              />
            )}
          </span>

          {showLabels && (
            <>
              <span className="flex-1 min-w-0 text-sm truncate">{label}</span>
              {badge !== null && (
                <span className="px-2 py-0.5 text-[11px] font-bold leading-none tabular-nums rounded-full bg-amber-400/15 text-amber-300">
                  {badge.toLocaleString()}
                </span>
              )}
            </>
          )}

          {!showLabels && badge !== null && (
            <span className="sr-only">
              {label}: {badge.toLocaleString()}
            </span>
          )}
        </button>
      </Tooltip>
    );
  };

  const renderGroup = (group: NavGroup) => (
    <div key={group.id} className="space-y-1.5">
      {showLabels ? (
        <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500">
          {t(group.labelKey)}
        </p>
      ) : (
        // Collapsed: a rule keeps the grouping readable without any text.
        <div className="mx-3 border-t border-slate-800" aria-hidden="true" />
      )}
      <div
        className="space-y-1"
        data-guide-id={group.id === "people" ? "admin-tabs" : undefined}
      >
        {group.items.map(renderItem)}
      </div>
    </div>
  );

  const collapseIcon = isRTL ? (
    isCollapsed ? <FaAngleDoubleLeft size={13} /> : <FaAngleDoubleRight size={13} />
  ) : isCollapsed ? (
    <FaAngleDoubleRight size={13} />
  ) : (
    <FaAngleDoubleLeft size={13} />
  );

  const panel = (
    <>
      {/* Brand */}
      <div
        className={cx(
          "flex items-center gap-3 border-b border-slate-800 py-5",
          showLabels ? "px-4" : "px-0 justify-center",
        )}
      >
        <span
          className={cx(
            "flex items-center justify-center w-9 h-9 shrink-0 text-white",
            RADIUS.sm,
          )}
          style={{ backgroundColor: BRAND.primary }}
        >
          <FaUsers size={15} />
        </span>
        {showLabels && (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-white truncate">
              {t("admin.userDataTitle")}
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate">
              {t("admin.panelName")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cx(
          "flex-1 py-4 space-y-5 overflow-y-auto overflow-x-hidden",
          showLabels ? "px-3" : "px-2",
        )}
        aria-label={t("admin.panelName")}
      >
        {visibleGroups.map(renderGroup)}
      </nav>

      {/* Footer */}
      <div
        className={cx(
          "py-3 space-y-1 border-t border-slate-800",
          showLabels ? "px-3" : "px-2",
        )}
      >
        {/* Desktop only: an overlay drawer is dismissed, not collapsed. */}
        {!isDrawerLayout && (
          <Tooltip
            label={t(isCollapsed ? "admin.shell.expand" : "admin.shell.collapse")}
            enabled={!showLabels}
          >
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={!isCollapsed}
              className={cx(
                "flex items-center w-full gap-3 py-2.5 text-slate-400",
                "hover:text-slate-100 hover:bg-white/5 transition-colors",
                RADIUS.sm,
                showLabels ? "px-3 text-start" : "px-0 justify-center",
              )}
            >
              <span className="flex items-center justify-center w-7 h-7 shrink-0">
                {collapseIcon}
              </span>
              {showLabels && (
                <span className="flex-1 min-w-0 text-sm font-medium truncate">
                  {t("admin.shell.collapse")}
                </span>
              )}
            </button>
          </Tooltip>
        )}

        <Tooltip label={t("admin.shell.pageHelp")} enabled={!showLabels}>
          <button
            type="button"
            onClick={() => replayGuide("admin-home")}
            className={cx(
              "flex items-center w-full gap-3 py-2.5 text-slate-400",
              "hover:text-slate-100 hover:bg-white/5 transition-colors",
              RADIUS.sm,
              showLabels ? "px-3 text-start" : "px-0 justify-center",
            )}
          >
            <span className="flex items-center justify-center w-7 h-7 shrink-0">
              <FaQuestionCircle size={14} />
            </span>
            {showLabels && (
              <span className="flex-1 min-w-0 text-sm font-medium truncate">
                {t("admin.shell.pageHelp")}
              </span>
            )}
          </button>
        </Tooltip>

        <Tooltip label={t("admin.shell.logout")} enabled={!showLabels}>
          <button
            type="button"
            onClick={onLogout}
            className={cx(
              "flex items-center w-full gap-3 py-2.5 text-slate-400",
              "hover:text-red-300 hover:bg-red-500/10 transition-colors",
              RADIUS.sm,
              showLabels ? "px-3 text-start" : "px-0 justify-center",
            )}
          >
            <span className="flex items-center justify-center w-7 h-7 shrink-0">
              <FaSignOutAlt size={14} />
            </span>
            {showLabels && (
              <span className="flex-1 min-w-0 text-sm font-medium truncate">
                {t("admin.shell.logout")}
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    </>
  );

  // ── Overlay drawer (tablet and phone) ──────────────────────────────────────
  // Rendered as a fixed layer so the content area keeps its full width and
  // nothing is squeezed or hidden underneath the sidebar.
  if (isDrawerLayout) {
    return (
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              key="admin-sidebar-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseDrawer}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.aside
              key="admin-sidebar-drawer"
              // Slides in from the inline start, which is the right in RTL.
              initial={{ x: isRTL ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className={cx(
                "fixed inset-y-0 start-0 z-50 flex flex-col",
                "w-[min(84vw,300px)] bg-slate-900",
                SHADOW.overlay,
              )}
              aria-label={t("admin.panelName")}
            >
              {panel}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // ── Docked rail (desktop) ──────────────────────────────────────────────────
  return (
    <motion.aside
      className={cx(
        // `overflow-hidden` keeps labels from spilling out mid-animation while
        // the width interpolates. Tooltips are position-fixed, so this does not
        // clip them.
        "sticky top-0 flex flex-col h-screen shrink-0 overflow-hidden bg-slate-900",
        isRTL ? "border-s border-slate-800" : "border-e border-slate-800",
      )}
      initial={false}
      animate={{
        width: isCollapsed ? SHELL.sidebarCollapsed : SHELL.sidebarExpanded,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      aria-label={t("admin.panelName")}
    >
      {panel}
    </motion.aside>
  );
};
