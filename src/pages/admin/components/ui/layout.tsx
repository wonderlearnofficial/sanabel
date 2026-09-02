import React from "react";
import { RADIUS, SHADOW, SHELL, SURFACE, TEXT, cx } from "../../theme";

// Page-level layout primitives. Before these existed, every admin view set its
// own gutters and heading sizes, so no two pages lined up vertically.

type Width = "content" | "form" | "full";

const WIDTH_STYLE: Record<Width, React.CSSProperties | undefined> = {
  // Analytics and wide operational tables want the whole viewport.
  full: undefined,
  // Everything else gets a measure, so a 2560px monitor does not stretch a
  // table to unreadable line lengths.
  content: { maxWidth: SHELL.contentMaxWidth },
  form: { maxWidth: SHELL.formMaxWidth },
};

export interface AdminPageProps {
  /** `content` by default; `full` for analytics; `form` for edit surfaces. */
  width?: Width;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scrollable page body inside the shell. Owns the page gutters and the vertical
 * rhythm between sections, so children never set their own outer margin.
 */
export const AdminPage: React.FC<AdminPageProps> = ({
  width = "content",
  className,
  children,
}) => (
  // No scroll container of its own: the document scrolls, and the shell header
  // and sidebar are both `sticky`, so they stay put without a nested scroller.
  <div className="flex-1 min-w-0">
    <div
      className={cx("flex flex-col gap-6 px-4 py-5 md:px-6 lg:px-8", className)}
      style={WIDTH_STYLE[width]}
    >
      {children}
    </div>
  </div>
);

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Rendered before the title, e.g. "Analytics / Approvals". */
  breadcrumbs?: string[];
  /** Trailing controls. Wraps below the title on narrow viewports. */
  actions?: React.ReactNode;
  /** Leading slot, used by the shell for the sidebar toggle. */
  leading?: React.ReactNode;
  className?: string;
}

/** Title block. Not sticky itself — the shell header above it is. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  leading,
  className,
}) => (
  <div
    className={cx(
      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}
  >
    <div className="flex items-center min-w-0 gap-3">
      {leading}
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-1" aria-label="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`${crumb}-${index}`}>
                {index > 0 && (
                  <span className="text-slate-300" aria-hidden="true">
                    /
                  </span>
                )}
                <span className={cx(TEXT.muted, "truncate")}>{crumb}</span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className={cx(TEXT.title, "truncate")}>{title}</h1>
        {description && (
          <p className={cx(TEXT.muted, "mt-1")}>{description}</p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
    )}
  </div>
);

export interface PageToolbarProps {
  /** Search and filters. */
  children: React.ReactNode;
  /** Right-hand slot: result count, bulk actions, density toggle. */
  trailing?: React.ReactNode;
  className?: string;
}

/** Filter/search strip above a data surface. */
export const PageToolbar: React.FC<PageToolbarProps> = ({
  children,
  trailing,
  className,
}) => (
  <div
    className={cx(
      "flex flex-col gap-3 p-3 lg:flex-row lg:items-center",
      SURFACE.card,
      RADIUS.md,
      SHADOW.card,
      className,
    )}
  >
    <div className="flex flex-wrap items-center flex-1 min-w-0 gap-2">
      {children}
    </div>
    {trailing && (
      <div className="flex items-center gap-2 shrink-0 lg:ms-auto">{trailing}</div>
    )}
  </div>
);

export interface ContentSectionProps {
  title?: string;
  description?: string;
  /** Controls in the section's own header row. */
  actions?: React.ReactNode;
  /** Footnote under the content, e.g. a data-availability caveat. */
  note?: string;
  /** Removes the inner padding, for a section whose child is a full-bleed table. */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** A titled card. The default container for anything on a page. */
export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  description,
  actions,
  note,
  flush = false,
  className,
  children,
}) => (
  <section
    className={cx("min-w-0", SURFACE.card, RADIUS.md, SHADOW.card, className)}
  >
    {(title || actions) && (
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="min-w-0">
          {title && <h2 className={cx(TEXT.heading, "truncate")}>{title}</h2>}
          {description && <p className={cx(TEXT.muted, "mt-0.5")}>{description}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 ms-auto">{actions}</div>
        )}
      </header>
    )}
    <div className={flush ? "min-w-0" : "min-w-0 p-4"}>{children}</div>
    {note && (
      <footer className="px-4 py-2.5 border-t border-slate-100">
        <p className="text-[11px] leading-relaxed text-slate-400">{note}</p>
      </footer>
    )}
  </section>
);
