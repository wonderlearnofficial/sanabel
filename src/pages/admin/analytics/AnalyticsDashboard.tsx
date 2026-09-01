import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { API_BASE_URL } from "../../../config/api";
import { describeApiError } from "../../../utils/apiError";

// Super-Admin-only analytics. Every panel is fed by /admin/analytics/*, which
// the backend gates with requireSuperAdmin — this component never decides
// authorization, it only renders what the server is willing to return.
//
// All aggregation happens in SQL; tables are server-paginated. Nothing here
// pulls a full dataset into the browser.

type Section = "overview" | "missions" | "people" | "organizations" | "approvals" | "assignments";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "overview", label: "admin.analytics.overview" },
  { key: "missions", label: "admin.analytics.missions" },
  { key: "people", label: "admin.analytics.people" },
  { key: "organizations", label: "admin.analytics.organizations" },
  { key: "approvals", label: "admin.analytics.approvals" },
  { key: "assignments", label: "admin.analytics.assignments" },
];

const isoDaysAgo = (days: number) =>
  new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const numberFormat = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString() : Number(value ?? 0).toLocaleString();

/** Renders a rate that is genuinely unknown as "—" rather than 0%. */
const RateValue: React.FC<{ value: number | null | undefined; suffix?: string }> = ({ value, suffix = "%" }) =>
  value === null || value === undefined ? <span className="text-slate-400">—</span> : <>{value}{suffix}</>;

const KpiCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-2xl">
    <p className="mb-1 text-xs font-medium leading-none text-slate-400">{label}</p>
    <h3 className="text-xl font-bold leading-none text-slate-800">{value}</h3>
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
  </div>
);

const Panel: React.FC<{ title: string; children: React.ReactNode; note?: string }> = ({ title, children, note }) => (
  <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl">
    <h4 className="mb-3 text-sm font-bold text-slate-700">{title}</h4>
    {children}
    {note && <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{note}</p>}
  </div>
);

const SimpleTable: React.FC<{ head: string[]; rows: React.ReactNode[][]; empty: string }> = ({ head, rows, empty }) => (
  <div className="overflow-x-auto">
    {rows.length === 0 ? (
      <p className="py-6 text-sm text-center text-slate-400">{empty}</p>
    ) : (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-100">
            {head.map((cell) => (
              <th key={cell} className="pb-2 pr-4 text-[11px] font-bold tracking-wide uppercase text-slate-400">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-50 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-2 pr-4 text-slate-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const AnalyticsDashboard: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>("overview");
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completions table state (server-paginated)
  const [completions, setCompletions] = useState<{ rows: any[]; total: number }>({ rows: [], total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 25;

  const endpoint = useMemo<Record<Section, string>>(
    () => ({
      overview: "overview",
      missions: "missions",
      people: "users",
      organizations: "organizations",
      approvals: "approvals",
      assignments: "assignments",
    }),
    [],
  );

  const loadSection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/analytics/${endpoint[section]}`,
        { headers: authHeaders(), params: { from, to }, timeout: 20000 },
      );
      setData((previous) => ({ ...previous, [section]: response.data.data }));
    } catch (requestError) {
      setError(t(describeApiError(requestError)));
    } finally {
      setLoading(false);
    }
  }, [section, from, to, endpoint, t]);

  const loadCompletions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/analytics/completions`, {
        headers: authHeaders(),
        params: { from, to, page, limit, search: search || undefined },
        timeout: 20000,
      });
      setCompletions({ rows: response.data.data ?? [], total: response.data.total ?? 0 });
    } catch (requestError) {
      setError(t(describeApiError(requestError)));
    }
  }, [from, to, page, search, t]);

  useEffect(() => { loadSection(); }, [loadSection]);
  useEffect(() => {
    if (section === "overview" || section === "people") loadCompletions();
  }, [section, loadCompletions]);

  const overview = data.overview;
  const missions = data.missions;
  const people = data.people;
  const organizations = data.organizations;
  const approvals = data.approvals;
  const assignments = data.assignments;

  return (
    <div className="flex flex-col gap-5">
      {/* Section tabs + date range */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                section === item.key ? "text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              style={section === item.key ? { backgroundColor: accentColor } : undefined}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ms-auto">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-600"
          />
          <span className="text-xs text-slate-400">→</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-600"
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50 rounded-xl">{error}</div>
      )}
      {loading && <p className="text-sm text-slate-400">{t("جاري التحميل...")}</p>}

      {/* ---------------------------------------------------------------- */}
      {section === "overview" && overview && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label={t("admin.analytics.totalUsers")} value={numberFormat(overview.people.totalUsers)} />
            <KpiCard label={t("admin.analytics.soloUsers")} value={numberFormat(overview.people.soloUsers)} />
            <KpiCard label={t("admin.analytics.schoolStudents")} value={numberFormat(overview.people.schoolStudents)} />
            <KpiCard label={t("admin.tab.teachers")} value={numberFormat(overview.people.teachers)} />
            <KpiCard label={t("admin.tab.parents")} value={numberFormat(overview.people.parents)} />
            <KpiCard label={t("admin.analytics.schoolAdmins")} value={numberFormat(overview.people.schoolAdmins)} />
            <KpiCard label={t("admin.analytics.superAdmins")} value={numberFormat(overview.people.superAdmins)} />
            <KpiCard label={t("admin.tab.organizations")} value={numberFormat(overview.people.organizations)} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label={t("admin.analytics.completionsToday")} value={numberFormat(overview.missions.completionsToday)} />
            <KpiCard label={t("admin.analytics.completionsWeek")} value={numberFormat(overview.missions.completionsThisWeek)} />
            <KpiCard label={t("admin.analytics.completionsMonth")} value={numberFormat(overview.missions.completionsThisMonth)} />
            <KpiCard label={t("admin.analytics.completionsAllTime")} value={numberFormat(overview.missions.completionsAllTime)} />
            <KpiCard label={t("admin.analytics.pendingApprovals")} value={numberFormat(overview.approvals.pending)} />
            <KpiCard label={t("admin.analytics.approved")} value={numberFormat(overview.approvals.approved)} />
            <KpiCard label={t("admin.analytics.denied")} value={numberFormat(overview.approvals.denied)} />
            <KpiCard
              label={t("admin.analytics.approvalRate")}
              value={<RateValue value={overview.approvals.approvalRate} />}
              hint={overview.approvals.resolvedTotal === 0 ? t("admin.analytics.noResolvedYet") : undefined}
            />
          </div>

          <Panel
            title={t("admin.analytics.notMeasured")}
            note={t("admin.analytics.notMeasuredNote")}
          >
            <ul className="text-xs leading-relaxed list-disc text-slate-500 ps-5">
              {Object.entries(overview.unavailableMetrics || {}).map(([key, reason]) => (
                <li key={key}>
                  <span className="font-semibold text-slate-600">{key}</span>: {String(reason)}
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {section === "missions" && missions && (
        <>
          <Panel title={t("admin.analytics.completionTrend")}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={missions.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="completions" stroke={accentColor} fill={accentColor} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title={t("admin.analytics.topToday")}>
              <SimpleTable
                head={[t("admin.analytics.mission"), t("admin.analytics.category"), t("admin.analytics.completions")]}
                rows={(missions.top.today || []).map((row: any) => [row.title, row.category ?? "—", numberFormat(row.completions)])}
                empty={t("admin.analytics.noData")}
              />
            </Panel>
            <Panel title={t("admin.analytics.topAllTime")}>
              <SimpleTable
                head={[t("admin.analytics.mission"), t("admin.analytics.category"), t("admin.analytics.completions")]}
                rows={(missions.top.allTime || []).map((row: any) => [row.title, row.category ?? "—", numberFormat(row.completions)])}
                empty={t("admin.analytics.noData")}
              />
            </Panel>
            <Panel title={t("admin.analytics.byCategory")}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={missions.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="completions" fill={accentColor} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title={t("admin.analytics.bySource")} note={t("admin.analytics.bySourceNote")}>
              <SimpleTable
                head={[t("admin.analytics.source"), t("admin.analytics.completions")]}
                rows={(missions.bySource || []).map((row: any) => [row.source, numberFormat(row.completions)])}
                empty={t("admin.analytics.noData")}
              />
            </Panel>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {section === "people" && (
        <>
          {people && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard label={t("admin.analytics.activeStudents")} value={numberFormat(people.activeStudents)} />
                <KpiCard
                  label={t("admin.analytics.avgPerActive")}
                  value={<RateValue value={people.averageCompletionsPerActiveStudent} suffix="" />}
                />
                <KpiCard label={t("admin.analytics.soloCompletions")} value={numberFormat(people.soloVsSchool?.soloCompletions)} />
                <KpiCard label={t("admin.analytics.schoolCompletions")} value={numberFormat(people.soloVsSchool?.schoolCompletions)} />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel title={t("admin.analytics.mostActive")}>
                  <SimpleTable
                    head={[t("admin.analytics.student"), t("admin.analytics.type"), t("المرحلة"), t("admin.analytics.completions")]}
                    rows={(people.mostActiveStudents || []).map((row: any) => [
                      `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || `#${row.studentId}`,
                      row.studentType,
                      row.level,
                      numberFormat(row.completions),
                    ])}
                    empty={t("admin.analytics.noData")}
                  />
                </Panel>
                <Panel title={t("admin.analytics.inactive")} note={t("admin.analytics.inactiveNote")}>
                  <SimpleTable
                    head={[t("admin.analytics.student"), t("admin.analytics.type"), t("admin.analytics.lastCompletion")]}
                    rows={(people.inactiveInRange || []).map((row: any) => [
                      `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || `#${row.studentId}`,
                      row.studentType,
                      row.lastCompletionDate ?? t("admin.analytics.never"),
                    ])}
                    empty={t("admin.analytics.noData")}
                  />
                </Panel>
              </div>
            </>
          )}

          {/* People who completed missions — server-paginated */}
          <Panel title={t("admin.analytics.whoCompleted")}>
            <div className="flex items-center gap-2 mb-3">
              <input
                value={search}
                onChange={(event) => { setPage(1); setSearch(event.target.value); }}
                placeholder={t("admin.analytics.searchPlaceholder")}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <SimpleTable
              head={[
                t("admin.analytics.student"), t("admin.analytics.type"), t("admin.tab.organizations"),
                t("admin.tab.classes"), t("admin.analytics.mission"), t("admin.analytics.category"),
                t("admin.analytics.date"), t("admin.analytics.source"), t("admin.analytics.confirmedBy"),
              ]}
              rows={completions.rows.map((row: any) => [
                row.student.name ?? `#${row.student.id}`,
                row.student.type,
                row.organization ?? "—",
                row.className ?? "—",
                row.mission.title ?? "—",
                row.mission.category ?? "—",
                row.date,
                row.completionSource ?? "—",
                row.confirmedBy ? `${row.confirmedBy.name ?? row.confirmedBy.type}` : "—",
              ])}
              empty={t("admin.analytics.noData")}
            />
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>{t("admin.analytics.total")}: {numberFormat(completions.total)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40"
                >
                  ‹
                </button>
                <span>{page} / {Math.max(1, Math.ceil(completions.total / limit))}</span>
                <button
                  type="button"
                  disabled={page >= Math.ceil(completions.total / limit)}
                  onClick={() => setPage((current) => current + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </Panel>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {section === "organizations" && organizations && (
        <Panel title={t("admin.analytics.perOrganization")}>
          <SimpleTable
            head={[
              t("admin.analytics.organization"), t("admin.tab.students"), t("admin.tab.teachers"),
              t("admin.tab.classes"), t("admin.analytics.completions"), t("admin.analytics.activeStudents"),
              t("admin.analytics.pendingApprovals"), t("admin.analytics.approvalRate"),
            ]}
            rows={organizations.map((row: any) => [
              row.name,
              numberFormat(row.students),
              numberFormat(row.teachers),
              numberFormat(row.classes),
              numberFormat(row.completionsInRange),
              numberFormat(row.activeStudentsInRange),
              numberFormat(row.pendingApprovals),
              <RateValue value={row.approvalRate} />,
            ])}
            empty={t("admin.analytics.noData")}
          />
        </Panel>
      )}

      {/* ---------------------------------------------------------------- */}
      {section === "approvals" && approvals && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label={t("admin.analytics.pendingApprovals")} value={numberFormat(approvals.totals.pending)} />
            <KpiCard label={t("admin.analytics.approved")} value={numberFormat(approvals.totals.approved)} />
            <KpiCard
              label={t("admin.analytics.denied")}
              value={numberFormat(approvals.totals.denied)}
              hint={!approvals.observations.denialsObserved ? t("admin.analytics.noneObserved") : undefined}
            />
            <KpiCard label={t("admin.analytics.approvalRate")} value={<RateValue value={approvals.totals.approvalRate} />} />
            <KpiCard label={t("admin.analytics.teacherApprovals")} value={numberFormat(approvals.teacherApprovals)} />
            <KpiCard
              label={t("admin.analytics.parentApprovals")}
              value={numberFormat(approvals.parentApprovals)}
              hint={!approvals.observations.parentApprovalsObserved ? t("admin.analytics.noneObserved") : undefined}
            />
            <KpiCard
              label={t("admin.analytics.avgResolution")}
              value={<RateValue value={approvals.totals.avgResolutionMinutes} suffix={` ${t("admin.analytics.minutes")}`} />}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title={t("admin.analytics.oldestPending")}>
              <SimpleTable
                head={[t("admin.analytics.mission"), t("admin.analytics.student"), t("admin.analytics.pendingHours")]}
                rows={(approvals.oldestPending || []).map((row: any) => [
                  row.missionTitle ?? "—",
                  `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || `#${row.studentId}`,
                  numberFormat(row.pendingHours),
                ])}
                empty={t("admin.analytics.noPending")}
              />
            </Panel>
            <Panel title={t("admin.analytics.slowestOrgs")}>
              <SimpleTable
                head={[t("admin.analytics.organization"), t("admin.analytics.avgResolution"), t("admin.analytics.resolved")]}
                rows={(approvals.slowestOrganizations || []).map((row: any) => [
                  row.name,
                  row.avgResolutionMinutes != null ? Number(row.avgResolutionMinutes).toFixed(1) : "—",
                  numberFormat(row.resolved),
                ])}
                empty={t("admin.analytics.noData")}
              />
            </Panel>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {section === "assignments" && assignments && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label={t("admin.analytics.activeTodos")} value={numberFormat(assignments.status.active)} />
            <KpiCard label={t("admin.analytics.pendingApproval")} value={numberFormat(assignments.status.pendingApproval)} />
            <KpiCard label={t("admin.analytics.completedTodos")} value={numberFormat(assignments.status.completed)} />
            <KpiCard label={t("admin.analytics.completionRate")} value={<RateValue value={assignments.status.completionRate} />} />
          </div>
          <Panel title={t("admin.analytics.bySourceType")} note={assignments.note}>
            <SimpleTable
              head={[t("admin.analytics.source"), t("admin.analytics.items"), t("admin.analytics.completedTodos"), t("admin.analytics.completionRate")]}
              rows={(assignments.bySource || []).map((row: any) => [
                row.sourceType,
                numberFormat(row.items),
                numberFormat(row.completedItems),
                <RateValue value={row.completionRate} />,
              ])}
              empty={t("admin.analytics.noData")}
            />
          </Panel>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
