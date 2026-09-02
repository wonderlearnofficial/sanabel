// The admin panel's navigation model and its one shared `Tab` type.
//
// `Tab` used to be declared seven separate times across the panel, in two
// incompatible shapes, so adding a page meant editing seven unions. This is now
// the single declaration; the shell (UserData / Sidebar / AdminHeader) imports
// it, and the nav tree below is the only place navigation structure lives.
//
// Visibility here is presentation only. Every one of these pages is also gated
// server-side — `requireSuperAdmin` re-resolves admin scope from the `Admins`
// table on each request and returns 403 regardless of what the sidebar shows.
// Never treat `superAdminOnly` as a security control.

export type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades"
  | "scores"
  | "history"
  | "app_version"
  | "analytics";

/** Sections of the Super Admin analytics page, driven from the sidebar. */
export type AnalyticsSection =
  | "overview"
  | "missions"
  | "people"
  | "organizations"
  | "approvals"
  | "assignments";

/** Icon identity, resolved to a component in `Sidebar.tsx`. */
export type NavIcon =
  | "dashboard"
  | "users"
  | "student"
  | "teacher"
  | "parent"
  | "shield"
  | "school"
  | "class"
  | "grade"
  | "trophy"
  | "history"
  | "chart"
  | "mission"
  | "approval"
  | "assignment"
  | "organization"
  | "app";

export interface NavItem {
  /** Stable id, unique across the whole tree. */
  id: string;
  /** Page this item opens. */
  tab: Tab;
  /** For analytics items, the section to show within the analytics page. */
  section?: AnalyticsSection;
  labelKey: string;
  icon: NavIcon;
  /**
   * Hidden from a School Admin. Mirrors the server gate; it does not create it.
   */
  superAdminOnly?: boolean;
  /**
   * Badge source. Only actionable counts get a badge — a permanent "23 users"
   * badge is noise, a pending-approval count is a queue the admin must clear.
   * `undefined` means this item never shows a badge.
   */
  badge?: "pendingApprovals";
}

export interface NavGroup {
  id: string;
  labelKey: string;
  superAdminOnly?: boolean;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "analytics",
    labelKey: "admin.nav.group.analytics",
    superAdminOnly: true,
    items: [
      {
        id: "analytics-overview",
        tab: "analytics",
        section: "overview",
        labelKey: "admin.analytics.overview",
        icon: "chart",
        superAdminOnly: true,
      },
      {
        id: "analytics-missions",
        tab: "analytics",
        section: "missions",
        labelKey: "admin.analytics.missions",
        icon: "mission",
        superAdminOnly: true,
      },
      {
        id: "analytics-people",
        tab: "analytics",
        section: "people",
        labelKey: "admin.analytics.people",
        icon: "users",
        superAdminOnly: true,
      },
      {
        id: "analytics-approvals",
        tab: "analytics",
        section: "approvals",
        labelKey: "admin.analytics.approvals",
        icon: "approval",
        superAdminOnly: true,
        badge: "pendingApprovals",
      },
      {
        id: "analytics-assignments",
        tab: "analytics",
        section: "assignments",
        labelKey: "admin.analytics.assignments",
        icon: "assignment",
        superAdminOnly: true,
      },
      {
        id: "analytics-organizations",
        tab: "analytics",
        section: "organizations",
        labelKey: "admin.analytics.organizations",
        icon: "organization",
        superAdminOnly: true,
      },
    ],
  },
  {
    id: "people",
    labelKey: "admin.nav.group.people",
    items: [
      { id: "users", tab: "users", labelKey: "admin.tab.users", icon: "users" },
      { id: "students", tab: "students", labelKey: "admin.tab.students", icon: "student" },
      { id: "teachers", tab: "teachers", labelKey: "admin.tab.teachers", icon: "teacher" },
      { id: "parents", tab: "parents", labelKey: "admin.tab.parents", icon: "parent" },
      {
        id: "admins",
        tab: "admins",
        labelKey: "admin.tab.admins",
        icon: "shield",
        superAdminOnly: true,
      },
    ],
  },
  {
    id: "activity",
    labelKey: "admin.nav.group.activity",
    items: [
      { id: "scores", tab: "scores", labelKey: "admin.tab.scores", icon: "trophy" },
      { id: "history", tab: "history", labelKey: "admin.tab.history", icon: "history" },
    ],
  },
  {
    id: "academics",
    labelKey: "admin.nav.group.academics",
    items: [
      {
        id: "organizations",
        tab: "organizations",
        labelKey: "admin.tab.organizations",
        icon: "school",
        superAdminOnly: true,
      },
      { id: "classes", tab: "classes", labelKey: "admin.tab.classes", icon: "class" },
      { id: "grades", tab: "grades", labelKey: "admin.tab.grades", icon: "grade" },
    ],
  },
  {
    id: "system",
    labelKey: "admin.nav.group.system",
    items: [
      // `GET/PUT /admin/app-version` is gated with `checkAdmin` only, not
      // `requireSuperAdmin`, so a School Admin is authorised for it server-side.
      // Marking it super-admin-only here would hide a page the API still serves
      // them, which is exactly the kind of frontend-only "security" that must
      // not be introduced. Left visible to match the real gate.
      { id: "app_version", tab: "app_version", labelKey: "admin.tab.app_version", icon: "app" },
    ],
  },
];

/** Tabs a School Admin must never see. Derived, so the tree stays the source. */
export const scopedAdminHiddenTabs = (): Tab[] => {
  const hidden = new Set<Tab>();
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (group.superAdminOnly || item.superAdminOnly) hidden.add(item.tab);
    }
  }
  return Array.from(hidden);
};

/** The nav item matching the current page (and analytics section, if any). */
export const findNavItem = (
  tab: Tab,
  section?: AnalyticsSection,
): NavItem | undefined => {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.tab !== tab) continue;
      if (item.section && section && item.section !== section) continue;
      return item;
    }
  }
  return undefined;
};

/** The group containing the current page, for breadcrumbs. */
export const findNavGroup = (
  tab: Tab,
  section?: AnalyticsSection,
): NavGroup | undefined =>
  NAV_GROUPS.find((group) =>
    group.items.some(
      (item) =>
        item.tab === tab &&
        (!item.section || !section || item.section === section),
    ),
  );
