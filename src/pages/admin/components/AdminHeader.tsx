import React from "react";
import { useTranslation } from "react-i18next";
import {
  FaBars,
  FaDownload,
  FaFileCsv,
  FaGlobe,
  FaPlus,
  FaSignOutAlt,
  FaUpload,
  FaUserShield,
} from "react-icons/fa";
import { Tab } from "../navigation";
import { RADIUS, SHADOW, SURFACE, TEXT, cx } from "../theme";
import { Button, IconButton } from "./ui/Button";
import { Menu } from "./ui/Menu";
import { GlobalSearch } from "./GlobalSearch";

/** Who is signed in, for the profile menu. */
export interface AdminIdentity {
  name: string;
  email: string;
  isSuperAdmin: boolean;
  /** Present for a School Admin, so their scope is visible at a glance. */
  organizationName?: string | null;
}

export interface AdminHeaderProps {
  /** Current page name. */
  title: string;
  /** Trail above the title, e.g. ["Analytics", "Approvals"]. */
  breadcrumbs?: string[];
  description?: string;

  /** Hamburger below the drawer breakpoint, collapse toggle above it. */
  onToggleSidebar: () => void;
  isDrawerLayout: boolean;

  /** Primary action. Omit both to render no create button on this page. */
  createLabel?: string;
  onCreateClick?: () => void;

  onExportClick: () => void;
  exporting: boolean;
  onImportClick: () => void;
  isImportable: boolean;

  onLanguageToggle: () => void;
  onLogout: () => void;

  identity: AdminIdentity | null;

  /** Global search wiring. */
  token: string | null;
  onSearchSelect: (tab: Tab, query: string) => void;
  /** False for a School Admin, who has no organizations page. */
  canSearchOrganizations: boolean;
}

/**
 * Sticky shell header.
 *
 * The old header put four peer buttons in one row — language, export, import,
 * create — which gave a destructive-ish bulk action the same weight as a
 * language toggle. Now there is exactly one primary action, and export/import
 * collapse into a data menu; language and identity move into the profile menu
 * on narrow viewports, where the row would otherwise wrap into three lines.
 */
export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  breadcrumbs,
  description,
  onToggleSidebar,
  isDrawerLayout,
  createLabel,
  onCreateClick,
  onExportClick,
  exporting,
  onImportClick,
  isImportable,
  onLanguageToggle,
  onLogout,
  identity,
  token,
  onSearchSelect,
  canSearchOrganizations,
}) => {
  const { t } = useTranslation();

  const dataMenuItems = [
    {
      id: "export",
      label: t("admin.export.button"),
      hint: t("admin.export.hint"),
      icon: <FaFileCsv size={13} />,
      onSelect: onExportClick,
      disabled: exporting,
    },
    {
      id: "import",
      label: t("admin.import.button"),
      hint: isImportable ? undefined : t("admin.import.unsupportedHere"),
      icon: <FaUpload size={13} />,
      onSelect: onImportClick,
      disabled: !isImportable,
    },
  ];

  const profileMenuItems = [
    {
      id: "language",
      label: t("admin.languageToggle"),
      icon: <FaGlobe size={13} />,
      onSelect: onLanguageToggle,
    },
    {
      id: "logout",
      label: t("admin.shell.logout"),
      icon: <FaSignOutAlt size={13} />,
      onSelect: onLogout,
      destructive: true,
    },
  ];

  const scopeLabel = identity
    ? identity.isSuperAdmin
      ? t("admin.scope.superAdmin")
      : identity.organizationName ?? t("admin.scope.schoolAdmin")
    : null;

  return (
    <header
      className={cx(
        "sticky top-0 z-30 flex flex-col gap-3 px-4 py-3 md:px-6 lg:px-8",
        SURFACE.header,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Sidebar control: opens the drawer on narrow viewports, collapses the
            rail on desktop. The sidebar footer carries the same action, which is
            what makes an already-collapsed rail expandable from within itself. */}
        <IconButton
          label={t(
            isDrawerLayout ? "admin.shell.openNavigation" : "admin.shell.collapse",
          )}
          onClick={onToggleSidebar}
        >
          <FaBars size={15} />
        </IconButton>

        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className="flex items-center gap-1.5"
              aria-label={t("admin.shell.breadcrumb")}
            >
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
            <p className={cx(TEXT.muted, "mt-0.5 truncate")}>{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ms-auto">
          {/* Search gets real width on desktop and drops to the second row
              below `lg`, so the title never collides with it. */}
          <GlobalSearch
            token={token}
            onSelect={onSearchSelect}
            includeOrganizations={canSearchOrganizations}
            className="hidden lg:block w-64 xl:w-80"
          />

          <Menu
            align="end"
            items={dataMenuItems}
            trigger={({ toggle }) => (
              <Button
                variant="secondary"
                icon={<FaDownload size={11} />}
                onClick={toggle}
                aria-haspopup="menu"
              >
                <span className="hidden sm:inline">{t("admin.shell.data")}</span>
              </Button>
            )}
          />

          {createLabel && onCreateClick && (
            <Button variant="primary" icon={<FaPlus size={10} />} onClick={onCreateClick}>
              {createLabel}
            </Button>
          )}

          <Menu
            align="end"
            title={identity?.email}
            items={profileMenuItems}
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-haspopup="menu"
                aria-label={t("admin.shell.accountMenu")}
                className={cx(
                  "flex items-center gap-2 px-1.5 py-1 transition-colors",
                  RADIUS.sm,
                  "hover:bg-slate-100",
                )}
              >
                <span
                  className={cx(
                    "flex items-center justify-center w-8 h-8 shrink-0",
                    "text-slate-500 bg-slate-100",
                    RADIUS.full,
                  )}
                >
                  <FaUserShield size={13} />
                </span>
                <span className="hidden min-w-0 text-start xl:block">
                  <span className="block text-xs font-semibold truncate text-slate-700">
                    {identity?.name || t("admin.tab.admins")}
                  </span>
                  {scopeLabel && (
                    <span className="block text-[11px] truncate text-slate-400">
                      {scopeLabel}
                    </span>
                  )}
                </span>
              </button>
            )}
          />
        </div>
      </div>

      {/* Search on tablet and phone. */}
      <GlobalSearch
        token={token}
        onSelect={onSearchSelect}
        includeOrganizations={canSearchOrganizations}
        className={cx("lg:hidden", SHADOW.none)}
      />
    </header>
  );
};
