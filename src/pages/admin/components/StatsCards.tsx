import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaChild,
  FaChalkboardTeacher,
  FaUserFriends,
  FaChevronDown,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades";

interface StatsCardsProps {
  stats: Record<string, number>;
  rows: any[];
  activeTab: Tab;
  accentColor: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  rows,
  activeTab,
  accentColor,
}) => {
  const { t } = useTranslation();
  const [showCharts, setShowCharts] = React.useState(false);

  // Construct charts data
  const roleData = React.useMemo(() => {
    return [
      {
        name: t("admin.role.Student"),
        value: stats.students ?? 0,
        color: "#06b6d4",
      },
      {
        name: t("admin.role.Teacher"),
        value: stats.teachers ?? 0,
        color: "#10b981",
      },
      {
        name: t("admin.role.Parent"),
        value: stats.parents ?? 0,
        color: "#f59e0b",
      },
    ].filter((d) => d.value > 0);
  }, [stats, t]);

  const gradeData = React.useMemo(() => {
    if (activeTab !== "students") return [];
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const n = r.GradeEntity?.name ?? r.grade ?? "Other";
      counts[n] = (counts[n] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows, activeTab]);

  const signupData = React.useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      return { label: d.toLocaleString("en-US", { month: "short" }), count: 0 };
    });
    for (const r of rows) {
      const d = new Date(r.createdAt ?? r.user?.createdAt ?? 0);
      const lbl = d.toLocaleString("en-US", { month: "short" });
      const m = months.find((m) => m.label === lbl);
      if (m) m.count++;
    }
    return months;
  }, [rows]);

  const cardItems = [
    {
      label: t("admin.tab.users"),
      value: stats.users ?? 0,
      icon: <FaUsers size={16} />,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: t("admin.tab.students"),
      value: stats.students ?? 0,
      icon: <FaChild size={16} />,
      color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    },
    {
      label: t("admin.tab.teachers"),
      value: stats.teachers ?? 0,
      icon: <FaChalkboardTeacher size={16} />,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: t("admin.tab.parents"),
      value: stats.parents ?? 0,
      icon: <FaUserFriends size={16} />,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
  ];

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardItems.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`flex items-center gap-4 p-4 bg-white border border-slate-100 shadow-sm rounded-2xl transition-all`}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${item.color.split(" ")[0]} ${item.color.split(" ")[1]}`}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium leading-none mb-1">
                {item.label}
              </p>
              <h3 className="text-xl font-bold text-slate-800 leading-none">
                {item.value.toLocaleString()}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expandable Chart Drawer */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowCharts((c) => !c)}
          className="flex items-center justify-between w-full px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>{t("admin.chart.distribution")} & Analytics</span>
          </div>
          <motion.span
            animate={{ rotate: showCharts ? 180 : 0 }}
            className="text-slate-400"
          >
            <FaChevronDown size={12} />
          </motion.span>
        </button>

        <AnimatePresence>
          {showCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100 p-5 bg-slate-50/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart 1: Donut */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("admin.chart.distribution")}
                  </p>
                  {roleData.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <ResponsiveContainer width={80} height={80}>
                        <PieChart>
                          <Pie
                            data={roleData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={36}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {roleData.map((e, i) => (
                              <Cell key={i} fill={e.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: 8,
                              fontSize: 10,
                              border: "none",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col min-w-0 gap-1.5 flex-1">
                        {roleData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <span
                              className="flex-shrink-0 w-2 h-2 rounded-full"
                              style={{ background: d.color }}
                            />
                            <span className="truncate text-slate-500">{d.name}</span>
                            <span className="font-bold text-slate-800 ms-auto">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center text-xs text-slate-400">
                      No Data
                    </div>
                  )}
                </div>

                {/* Chart 2: Grade/Growth */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === "students" ? t("admin.chart.byGrade") : t("admin.chart.growth")}
                  </p>
                  {activeTab === "students" && gradeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={gradeData} barSize={16}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 9, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 8,
                            fontSize: 10,
                            border: "none",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={accentColor} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={80}>
                      <AreaChart data={signupData}>
                        <defs>
                          <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 8,
                            fontSize: 10,
                            border: "none",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={accentColor}
                          strokeWidth={2}
                          fill="url(#signupGrad)"
                          dot={{ r: 2, fill: accentColor }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Chart 3: Spark Stats */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Overview Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: t("admin.role.Student"), val: stats.students ?? 0, c: "#06b6d4" },
                      { label: t("admin.role.Teacher"), val: stats.teachers ?? 0, c: "#10b981" },
                      { label: t("admin.role.Parent"), val: stats.parents ?? 0, c: "#f59e0b" },
                      { label: t("admin.tab.users"), val: stats.users ?? 0, c: "#3b82f6" },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="p-1.5 rounded-lg flex items-center justify-between"
                        style={{ backgroundColor: `${s.c}08` }}
                      >
                        <span className="text-slate-500">{s.label}</span>
                        <span className="font-bold" style={{ color: s.c }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
