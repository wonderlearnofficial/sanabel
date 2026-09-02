// Admin design tokens.
//
// One source of truth for the admin panel's surfaces, text, spacing, radii and
// control sizing. Before this existed, every admin component picked its own
// rounding, padding, shadow and slate shade, so no two cards matched.
//
// These are Tailwind class strings rather than CSS variables on purpose: the
// panel is already Tailwind-only, and class strings keep `tailwind.config.js`
// content scanning working without a runtime style layer.
//
// Rules for using them:
//   - Compose with `cx()`; never re-declare a radius, shadow or slate shade
//     inline when a token already covers it.
//   - Only logical direction utilities (ms/me/ps/pe/start/end/text-start) —
//     the panel is Arabic-first RTL.

/** Joins class names, dropping falsy entries. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

// ─── Spacing ──────────────────────────────────────────────────────────────────
//
// The panel's spacing scale is 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 px, i.e.
// Tailwind steps 1, 2, 3, 4, 5, 6, 8, 10. Nothing outside that set.
//
// This is a convention, not an exported constant: Tailwind resolves class names
// at build time by scanning source text, so a composed `gap-${SPACE.lg}` would
// never be generated. Write the literal step and keep it on the scale.
//
//   4px  icon-to-label, chip internals            gap-1  p-1
//   8px  tight stacks                             gap-2  p-2
//   12px control padding, dense table cells        gap-3  p-3
//   16px default card padding, grid gap            gap-4  p-4
//   20px roomy card padding                       gap-5  p-5
//   24px gap between page sections                gap-6
//   32px page gutter on desktop                   px-8
//   40px major section separation                 gap-10
//
// The audit found eleven distinct gap values and four competing card paddings
// across nine admin components. That is what this scale exists to end.

// ─── Radii ────────────────────────────────────────────────────────────────────
// 8 / 12 / 16 only. Deliberately no rounded-2xl (24px) or larger: oversized
// rounding reads as a consumer app, not an operations console.

export const RADIUS = {
  /** 8px — inputs, buttons, badges, table controls */
  sm: "rounded-lg",
  /** 12px — cards, panels, menus, drawers */
  md: "rounded-xl",
  /** 16px — modals and the largest containers only */
  lg: "rounded-2xl",
  full: "rounded-full",
} as const;

// ─── Surfaces ─────────────────────────────────────────────────────────────────

export const SURFACE = {
  /** The page canvas behind every card. */
  page: "bg-slate-50",
  /** Default raised surface: cards, panels, table shells. */
  card: "bg-white border border-slate-200",
  /** A card that is interactive as a whole. */
  cardInteractive:
    "bg-white border border-slate-200 hover:border-slate-300 transition-colors",
  /** Inset region inside a card: toolbars, table headers, footers. */
  sunken: "bg-slate-50 border border-slate-200",
  /** Sticky header — translucent so content scrolling under it stays legible. */
  header: "bg-white/90 backdrop-blur-md border-b border-slate-200",
  /** Sidebar and other dark chrome. */
  dark: "bg-slate-900",
  /** Border inside dark chrome. */
  darkBorder: "border-slate-800",
  /** Floating layer: menus, popovers, tooltips, drawers. */
  overlay: "bg-white border border-slate-200",
  /** Modal scrim. */
  scrim: "bg-slate-900/50 backdrop-blur-sm",
} as const;

// ─── Elevation ────────────────────────────────────────────────────────────────
// Three levels. A card and a modal must not share a shadow.

export const SHADOW = {
  /** Resting cards. Almost flat — the border carries the edge. */
  card: "shadow-sm",
  /** Lifted: menus, popovers, sticky toolbars. */
  raised: "shadow-md",
  /** Modals, drawers, the mobile navigation overlay. */
  overlay: "shadow-2xl",
  none: "shadow-none",
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
// Five text roles. Anything outside this set needs a reason.

export const TEXT = {
  /** Page title. */
  title: "text-xl font-bold text-slate-900",
  /** Section / card heading. */
  heading: "text-sm font-bold text-slate-800",
  /** Body copy and table cells. */
  body: "text-sm text-slate-700",
  /** Secondary and supporting copy. */
  muted: "text-xs text-slate-500",
  /** Table column headers and group labels. */
  label: "text-[11px] font-bold uppercase tracking-wide text-slate-400",
  /** A metric's number. */
  metric: "text-2xl font-bold leading-none text-slate-900 tabular-nums",
} as const;

// ─── Semantic colors ──────────────────────────────────────────────────────────
// `tint` = subtle background + matching text, for badges and inline status.
// `solid` = filled control. `text` = standalone coloured text.

export const STATUS = {
  primary: {
    tint: "bg-sky-50 text-sky-700 border-sky-200",
    solid: "bg-sky-600 text-white hover:bg-sky-700",
    text: "text-sky-700",
  },
  success: {
    tint: "bg-emerald-50 text-emerald-700 border-emerald-200",
    solid: "bg-emerald-600 text-white hover:bg-emerald-700",
    text: "text-emerald-700",
  },
  warning: {
    tint: "bg-amber-50 text-amber-700 border-amber-200",
    solid: "bg-amber-500 text-white hover:bg-amber-600",
    text: "text-amber-700",
  },
  danger: {
    tint: "bg-red-50 text-red-700 border-red-200",
    solid: "bg-red-600 text-white hover:bg-red-700",
    text: "text-red-700",
  },
  info: {
    tint: "bg-indigo-50 text-indigo-700 border-indigo-200",
    solid: "bg-indigo-600 text-white hover:bg-indigo-700",
    text: "text-indigo-700",
  },
  neutral: {
    tint: "bg-slate-100 text-slate-600 border-slate-200",
    solid: "bg-slate-800 text-white hover:bg-slate-900",
    text: "text-slate-600",
  },
} as const;

export type StatusTone = keyof typeof STATUS;

/**
 * Sanabel primary, from `tailwind.config.js` (`blueprimary`). The admin panel
 * previously used a different accent per tab, which meant the product had no
 * recognisable colour. Brand blue is now the single accent; per-entity colour
 * survives only as the small leading icon tint on data pages.
 */
export const BRAND = {
  primary: "#4AAAD6",
  primaryStrong: "#3591BC",
  primarySoft: "#E8F5FB",
  /** Sanabel red / yellow / green, for entity icon tints and charts. */
  red: "#E14E54",
  yellow: "#FAB700",
  green: "#153D39",
} as const;

/**
 * Per-entity accent, threaded to the data-page components as `accentColor`.
 *
 * The shell itself (sidebar, primary buttons, active indicators) is always
 * `BRAND.primary` — the panel used to recolour its whole chrome per tab, which
 * left it with no recognisable identity. These survive only as the accent on a
 * data page's own controls, so an admin can still tell the entity pages apart.
 * Collapsing them to a single colour is a product decision, not a refactor.
 */
export const ENTITY_ACCENT = {
  users: BRAND.primary,
  students: "#06b6d4",
  teachers: "#10b981",
  parents: BRAND.yellow,
  admins: "#a855f7",
  classes: BRAND.red,
  organizations: "#6366f1",
  grades: "#8b5cf6",
  scores: BRAND.yellow,
  history: "#10b981",
  app_version: "#6366f1",
  analytics: BRAND.primary,
} as const;

/** Recharts series colours, in the order a chart should consume them. */
export const CHART_SERIES = [
  BRAND.primary,
  "#6366f1",
  BRAND.yellow,
  "#10b981",
  BRAND.red,
  "#a855f7",
] as const;

// ─── Controls ─────────────────────────────────────────────────────────────────
// Inputs and buttons share a height so they line up in a toolbar.

export const CONTROL = {
  /** 32px — dense table-row controls. */
  heightSm: "h-8",
  /** 36px — the default for buttons, inputs and selects. */
  height: "h-9",
  /** 44px — touch targets on mobile and primary form fields. */
  heightLg: "h-11",
  /** Text input / select. */
  input: cx(
    "h-9 w-full px-3 text-sm text-slate-800 placeholder:text-slate-400",
    "bg-white border border-slate-200 rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400",
    "disabled:bg-slate-50 disabled:text-slate-400",
  ),
  /**
   * Secondary/ghost button surface. Button chrome as a whole lives in the
   * `Button` component rather than here — two sources for one control would
   * drift apart, which is the problem this file exists to fix.
   */
  buttonGhost: "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
  buttonQuiet: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
} as const;

// ─── Table density ────────────────────────────────────────────────────────────
// One density per table, applied to every cell in it.

export const TABLE = {
  /** Column header cell. */
  head: cx(TEXT.label, "px-4 py-2.5 text-start whitespace-nowrap"),
  /** Default row: 12px vertical. */
  cell: "px-4 py-3 text-sm text-slate-700 align-middle",
  /** Dense row: 8px vertical, for wide operational tables. */
  cellDense: "px-3 py-2 text-sm text-slate-700 align-middle",
  row: "border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors",
  /** Every table must sit in this so wide content scrolls itself, not the page. */
  scroll: "w-full overflow-x-auto",
} as const;

// ─── Shell geometry ───────────────────────────────────────────────────────────
// Pixels, because the sidebar animates its width and Tailwind cannot
// interpolate between two named width classes.

export const SHELL = {
  sidebarExpanded: 272,
  sidebarCollapsed: 76,
  /** Below this viewport width the sidebar becomes an overlay drawer. */
  drawerBreakpoint: 1024,
  /** Comfortable reading measure for forms and prose. Analytics ignores it. */
  contentMaxWidth: 1440,
  formMaxWidth: 720,
} as const;

/** localStorage key for the sidebar collapse preference. */
export const SIDEBAR_STORAGE_KEY = "sanabel-admin-sidebar-collapsed";
