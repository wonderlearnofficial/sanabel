import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { FaBuilding, FaSchool, FaSearch, FaSpinner, FaUsers } from "react-icons/fa";
import { API_BASE_URL } from "../../../config/api";
import { describeApiError } from "../../../utils/apiError";
import { Tab } from "../navigation";
import { CONTROL, RADIUS, SHADOW, SURFACE, TEXT, cx } from "../theme";

/**
 * Global admin search.
 *
 * Fans out to three existing list endpoints — `/admin/users`,
 * `/admin/organizations`, `/admin/classes` — each with `search` and a small
 * `limit`. All matching is server-side (`Op.like` in `adminController`), so the
 * browser never holds a full dataset.
 *
 * Authorization is unchanged and still entirely the server's: each endpoint
 * applies `req.adminOrganizationId` itself, so a School Admin's results are
 * already scoped to their own organization and `listUsers` still excludes Admin
 * accounts from them. This component adds no filtering of its own and must not.
 *
 * Selecting a result navigates to that entity's page with the query applied as
 * its filter, which is the only honest destination: the panel has no per-row
 * detail route for organizations or classes.
 *
 * Not searchable, deliberately:
 *   - numeric id — the endpoints match `firstName`/`lastName`/`email`/`name`
 *     with LIKE and have no id branch.
 *   - `connectCode` — no endpoint accepts it, and `Students.connectCode` has no
 *     UNIQUE constraint, so a match could not identify one student anyway.
 */

interface SearchResult {
  id: number;
  /** Entity page this result lives on. */
  tab: Tab;
  primary: string;
  secondary?: string;
  groupKey: "users" | "organizations" | "classes";
}

const GROUPS: {
  key: SearchResult["groupKey"];
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  { key: "users", labelKey: "admin.tab.users", icon: <FaUsers size={12} /> },
  {
    key: "organizations",
    labelKey: "admin.tab.organizations",
    icon: <FaBuilding size={12} />,
  },
  { key: "classes", labelKey: "admin.tab.classes", icon: <FaSchool size={12} /> },
];

const MIN_QUERY_LENGTH = 2;
const RESULTS_PER_GROUP = 5;
const DEBOUNCE_MS = 300;

export interface GlobalSearchProps {
  token: string | null;
  /** Navigate to `tab` and apply `query` as that page's search filter. */
  onSelect: (tab: Tab, query: string) => void;
  /** Organizations page is Super-Admin-only; omit that group otherwise. */
  includeOrganizations: boolean;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  token,
  onSelect,
  includeOrganizations,
  className,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(
    async (term: string, signal: AbortSignal) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      const headers = { Authorization: `Bearer ${token}` };
      const params = { search: term, limit: RESULTS_PER_GROUP };

      const requests: Promise<SearchResult[]>[] = [
        axios
          .get(`${API_BASE_URL}/admin/users`, { headers, params, signal })
          .then((response) =>
            (response.data.data ?? []).map(
              (row: any): SearchResult => ({
                id: row.id,
                // Land on the page for this person's role so the row's own
                // actions (reset password, impersonate) are available.
                tab:
                  row.role === "Student"
                    ? "students"
                    : row.role === "Teacher"
                    ? "teachers"
                    : row.role === "Parent"
                    ? "parents"
                    : row.role === "Admin"
                    ? "admins"
                    : "users",
                primary:
                  `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() ||
                  row.email ||
                  `#${row.id}`,
                secondary: row.email,
                groupKey: "users",
              }),
            ),
          ),
        axios
          .get(`${API_BASE_URL}/admin/classes`, { headers, params, signal })
          .then((response) =>
            (response.data.data ?? []).map(
              (row: any): SearchResult => ({
                id: row.id,
                tab: "classes",
                primary: row.classname ?? `#${row.id}`,
                secondary:
                  row.Organization?.name ?? row.GradeEntity?.name ?? undefined,
                groupKey: "classes",
              }),
            ),
          ),
      ];

      if (includeOrganizations) {
        requests.push(
          axios
            .get(`${API_BASE_URL}/admin/organizations`, { headers, params, signal })
            .then((response) =>
              (response.data.data ?? []).map(
                (row: any): SearchResult => ({
                  id: row.id,
                  tab: "organizations",
                  primary: row.name ?? `#${row.id}`,
                  secondary: row.type,
                  groupKey: "organizations",
                }),
              ),
            ),
        );
      }

      const settled = await Promise.allSettled(requests);
      if (signal.aborted) return;

      const found = settled.flatMap((outcome) =>
        outcome.status === "fulfilled" ? outcome.value : [],
      );
      const failure = settled.find(
        (outcome) =>
          outcome.status === "rejected" &&
          !axios.isCancel((outcome as PromiseRejectedResult).reason),
      ) as PromiseRejectedResult | undefined;

      setResults(found);
      // Say which part failed rather than hiding a partial result set behind a
      // generic message, and keep whatever did come back on screen.
      setError(
        failure
          ? describeApiError(failure.reason, (key, options) => t(key, options))
          : null,
      );
      setLoading(false);
    },
    [token, includeOrganizations, t],
  );

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void runSearch(term, controller.signal);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, runSearch]);

  // Close on outside click and on Escape; open on Ctrl/Cmd+K.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        return;
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const choose = (result: SearchResult) => {
    setOpen(false);
    onSelect(result.tab, query.trim());
  };

  const term = query.trim();
  const showPanel = open && term.length >= MIN_QUERY_LENGTH;
  const visibleGroups = GROUPS.filter(
    (group) => group.key !== "organizations" || includeOrganizations,
  );

  return (
    <div ref={containerRef} className={cx("relative", className)}>
      <span className="absolute inset-y-0 flex items-center pointer-events-none start-3 text-slate-400">
        {loading ? (
          <FaSpinner size={12} className="animate-spin" />
        ) : (
          <FaSearch size={12} />
        )}
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t("admin.search.globalPlaceholder")}
        aria-label={t("admin.search.globalPlaceholder")}
        className={cx(CONTROL.input, "ps-9")}
      />

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className={cx(
              "absolute z-50 mt-2 w-full max-h-[70vh] overflow-y-auto p-1.5 start-0",
              SURFACE.overlay,
              RADIUS.md,
              SHADOW.raised,
            )}
          >
            {error && (
              <p className="px-2.5 py-2 text-xs text-red-600">{error}</p>
            )}

            {!loading && !error && results.length === 0 && (
              <p className={cx(TEXT.muted, "px-2.5 py-3 text-center")}>
                {t("admin.search.noResults")}
              </p>
            )}

            {visibleGroups.map((group) => {
              const groupResults = results.filter(
                (result) => result.groupKey === group.key,
              );
              if (groupResults.length === 0) return null;
              return (
                <div key={group.key} className="mb-1 last:mb-0">
                  <p
                    className={cx(
                      TEXT.label,
                      "flex items-center gap-1.5 px-2.5 pt-2 pb-1.5",
                    )}
                  >
                    <span className="text-slate-300">{group.icon}</span>
                    {t(group.labelKey)}
                  </p>
                  {groupResults.map((result) => (
                    <button
                      key={`${result.groupKey}-${result.id}`}
                      type="button"
                      onClick={() => choose(result)}
                      className={cx(
                        "flex flex-col w-full gap-0.5 px-2.5 py-2 text-start",
                        "hover:bg-slate-100 transition-colors",
                        RADIUS.sm,
                      )}
                    >
                      <span className="text-sm font-medium truncate text-slate-800">
                        {result.primary}
                      </span>
                      {result.secondary && (
                        <span
                          className="text-[11px] text-slate-400 truncate"
                          dir="ltr"
                        >
                          {result.secondary}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
