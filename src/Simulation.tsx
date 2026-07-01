import { useState, useMemo } from "react";
import { calculateLevel } from "./utils/LevelCalculator";
import { medalsData } from "./data/MedalsData";
import { treeStages } from "./data/Tree";
import sanabelType from "./data/SanabelTypeData";
import { challengeData, treeData, TaskCategory } from "./data/SimulationData";

import waterImg from "./assets/resources/ماء.png";
import fertilizerImg from "./assets/resources/سماد.png";
import blueImg from "./assets/resources/سنبلة زرقاء.png";
import redImg from "./assets/resources/سنبلة حمراء.png";
import yellowImg from "./assets/resources/سنبلة صفراء.png";

type Tab = "xp" | "tree" | "inventory" | "challenges" | "table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMedalIndex = (level: number) => {
  if (level >= 200) return 8;
  if (level >= 150) return 7;
  if (level >= 100) return 6;
  if (level >= 75) return 5;
  if (level >= 50) return 4;
  if (level >= 25) return 3;
  if (level >= 10) return 2;
  if (level >= 5) return 1;
  return 0;
};

const computeThresholds = () => {
  const rows: { level: number; xpToAdvance: number; cumulativeXp: number }[] =
    [];
  let cumulative = 0;
  for (let lv = 1; lv <= 200; lv++) {
    const needed = 10 + 3 * (lv - 1);
    rows.push({ level: lv, xpToAdvance: needed, cumulativeXp: cumulative });
    cumulative += needed;
  }
  return rows;
};

const CATEGORY_LABELS: Record<string, string> = {
  [TaskCategory.task]: "Category (كل الله / النفس…)",
  [TaskCategory.treestage]: "Tree Stage",
  [TaskCategory.treelevel]: "Tree Progress",
  [TaskCategory.alltask]: "All Missions",
  [TaskCategory.snabelBlue]: "Total Blue",
  [TaskCategory.snabelYellow]: "Total Yellow",
  [TaskCategory.snabelRed]: "Total Red",
  [TaskCategory.snabelMixed]: "Total Mixed",
  [TaskCategory.xp]: "Total XP",
  [TaskCategory.water]: "Total Water",
  [TaskCategory.seeder]: "Total Fertilizer",
  [TaskCategory.tasktype]: "Per Task-Type",
};

const CATEGORY_COLORS: Record<string, string> = {
  [TaskCategory.task]: "bg-blue-100 text-blue-800",
  [TaskCategory.treestage]: "bg-green-100 text-green-800",
  [TaskCategory.treelevel]: "bg-emerald-100 text-emerald-800",
  [TaskCategory.alltask]: "bg-purple-100 text-purple-800",
  [TaskCategory.snabelBlue]: "bg-sky-100 text-sky-800",
  [TaskCategory.snabelYellow]: "bg-yellow-100 text-yellow-800",
  [TaskCategory.snabelRed]: "bg-red-100 text-red-800",
  [TaskCategory.snabelMixed]: "bg-orange-100 text-orange-800",
  [TaskCategory.xp]: "bg-amber-100 text-amber-800",
  [TaskCategory.water]: "bg-cyan-100 text-cyan-800",
  [TaskCategory.seeder]: "bg-lime-100 text-lime-800",
  [TaskCategory.tasktype]: "bg-indigo-100 text-indigo-800",
};

// Rewards per sanabel type (mirrors SanabelTypeData)
const REWARDS = [
  { label: "مع الله", color: "bg-blue-500", blue: 2, red: 2, yellow: 2, xp: 5 },
  {
    label: "مع النفس",
    color: "bg-purple-500",
    blue: 2,
    red: 1,
    yellow: 1,
    xp: 5,
  },
  {
    label: "مع الأسرة والمجتمع",
    color: "bg-red-500",
    blue: 1,
    red: 2,
    yellow: 1,
    xp: 5,
  },
  {
    label: "مع الأرض والكون",
    color: "bg-green-500",
    blue: 1,
    red: 1,
    yellow: 2,
    xp: 5,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
    <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
      {label}
    </p>
    <p className="text-3xl font-bold text-[#4AAAD6]">{value}</p>
    {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Simulation: React.FC = () => {
  const [tab, setTab] = useState<Tab>("xp");

  // XP tab
  const [xpInput, setXpInput] = useState(0);

  // Tree tab
  const [treeProgress, setTreeProgress] = useState(0);

  // Inventory tab
  const [inv, setInv] = useState({ blue: 0, red: 0, yellow: 0, xp: 0 });
  const [history, setHistory] = useState<
    { label: string; blue: number; red: number; yellow: number; xp: number }[]
  >([]);

  // Challenges tab
  const [catFilter, setCatFilter] = useState<string>("all");
  const [titleFilter, setTitleFilter] = useState("");

  // ── XP calculations
  const { level, remainingXp, xpForNextLevel } = calculateLevel(xpInput);
  const medalIndex = getMedalIndex(level);
  const medal = medalsData[medalIndex];
  const progressPct =
    xpForNextLevel > 0 ? Math.round((remainingXp / xpForNextLevel) * 100) : 0;

  const thresholds = useMemo(computeThresholds, []);

  // ── Tree calculations
  const isFinalStage = treeProgress >= 51;
  const currentTreeEntry = treeData.find(
    (t) => t.treeProgress === treeProgress,
  );

  // ── Inventory XP
  const {
    level: invLevel,
    remainingXp: invRemaining,
    xpForNextLevel: invNeeded,
  } = calculateLevel(inv.xp);
  const invMedalIndex = getMedalIndex(invLevel);

  // ── Challenges filtering
  const allCategories = useMemo(
    () => [...new Set(challengeData.map((c) => c.category))],
    [],
  );
  const filteredChallenges = useMemo(() => {
    return challengeData.filter((c) => {
      const matchesCat = catFilter === "all" || c.category === catFilter;
      const matchesTitle =
        !titleFilter ||
        c.title.toLowerCase().includes(titleFilter.toLowerCase()) ||
        (c.tasktype ?? "").toLowerCase().includes(titleFilter.toLowerCase());
      return matchesCat && matchesTitle;
    });
  }, [catFilter, titleFilter]);

  const completeChallenge = (i: number) => {
    const r = REWARDS[i];
    setInv((prev) => ({
      blue: prev.blue + r.blue,
      red: prev.red + r.red,
      yellow: prev.yellow + r.yellow,
      xp: prev.xp + r.xp,
    }));
    setHistory((prev) => [{ ...r, label: sanabelType[i].name }, ...prev]);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "xp", label: "XP & Levels" },
    { id: "inventory", label: "Inventory Sim" },
    { id: "tree", label: "Tree Preview" },
    { id: "challenges", label: "Challenges" },
    { id: "table", label: "Level Table" },
  ];

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden bg-gray-50"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-[#4AAAD6] text-white shadow-md">
        <div className="px-8 py-3">
          <h1 className="text-xl font-bold">Sanabel — Simulation Dashboard</h1>
          <p className="text-blue-100 text-xs mt-0.5">
            Balance calculator · {challengeData.length} total challenge entries
          </p>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex px-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#4AAAD6] text-[#4AAAD6]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {/* ════════════════════════════════════════════
              XP & LEVELS
          ════════════════════════════════════════════ */}
          {tab === "xp" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
              {/* Input column */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h2 className="mb-4 text-base font-semibold text-gray-700">
                    Input Total XP
                  </h2>
                  <input
                    type="number"
                    min={0}
                    value={xpInput}
                    onChange={(e) =>
                      setXpInput(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#4AAAD6]"
                  />
                  <input
                    type="range"
                    min={0}
                    max={30000}
                    value={xpInput}
                    onChange={(e) => setXpInput(Number(e.target.value))}
                    className="w-full mt-3 accent-[#4AAAD6]"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>0</span>
                    <span>30,000</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <img
                    src={medal.img}
                    alt={medal.title}
                    className="w-14 h-14"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Current Medal</p>
                    <p className="text-lg font-bold text-gray-800" dir="rtl">
                      {medal.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Unlocked at level {medal.level}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats columns */}
              <div className="space-y-5 xl:col-span-3">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Level" value={level} />
                  <StatCard
                    label="Progress XP"
                    value={`${remainingXp} / ${xpForNextLevel}`}
                    sub={`${xpForNextLevel - remainingXp} XP to next level`}
                  />
                  <StatCard label="Progress" value={`${progressPct}%`} />
                </div>

                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <div className="flex justify-between mb-2 text-xs text-gray-500">
                    <span>Level {level}</span>
                    <span>Level {level + 1}</span>
                  </div>
                  <div className="w-full bg-[#fab70050] rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-[#F3B14E] h-5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-right text-gray-400">
                    {progressPct}%
                  </p>
                </div>

                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    XP Formula
                  </h3>
                  <div className="p-3 space-y-1 font-mono text-sm text-gray-700 rounded-lg bg-gray-50">
                    <p>
                      XP to advance level <strong>n</strong> ={" "}
                      <strong>10 + 3 × (n − 1)</strong>
                    </p>
                    <p className="text-gray-400">
                      Level {level} → {level + 1}: needs{" "}
                      <strong>{xpForNextLevel} XP</strong>
                    </p>
                    <p className="text-gray-400">
                      Level {level + 1} → {level + 2}: needs{" "}
                      <strong>{10 + 3 * level} XP</strong>
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Medal Milestones
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                    {medalsData.map((m, i) => (
                      <div
                        key={i}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center ${
                          medalIndex === i
                            ? "border-[#4AAAD6] bg-blue-50"
                            : "border-gray-100"
                        }`}
                      >
                        <img src={m.img} className="w-10 h-10" alt={m.title} />
                        <p className="text-xs text-gray-400">Lv {m.level}+</p>
                        <p
                          className="text-xs font-bold leading-tight text-gray-700"
                          dir="rtl"
                        >
                          {m.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              INVENTORY SIM
          ════════════════════════════════════════════ */}
          {tab === "inventory" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Left */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h2 className="mb-4 text-base font-semibold text-gray-700">
                    Complete Challenges
                  </h2>
                  <div className="space-y-3">
                    {REWARDS.map((r, i) => (
                      <div
                        key={i}
                        className="p-4 border border-gray-100 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="font-medium text-gray-700 text-sm truncate max-w-[55%]"
                            dir="rtl"
                          >
                            {sanabelType[i].name}
                          </span>
                          <button
                            onClick={() => completeChallenge(i)}
                            className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold ${r.color} hover:opacity-90 transition-opacity`}
                          >
                            +1 Complete
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <img src={blueImg} className="w-4 h-4" alt="" />+
                            {r.blue}
                          </span>
                          <span className="flex items-center gap-1">
                            <img src={redImg} className="w-4 h-4" alt="" />+
                            {r.red}
                          </span>
                          <span className="flex items-center gap-1">
                            <img src={yellowImg} className="w-4 h-4" alt="" />+
                            {r.yellow}
                          </span>
                          <span className="font-bold text-yellow-600">
                            +{r.xp} XP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        History ({history.length})
                      </h3>
                      <button
                        onClick={() => {
                          setInv({ blue: 0, red: 0, yellow: 0, xp: 0 });
                          setHistory([]);
                        }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Reset all
                      </button>
                    </div>
                    <ul className="space-y-1 overflow-y-auto text-xs text-gray-500 max-h-52">
                      {history.map((h, i) => (
                        <li
                          key={i}
                          className="flex justify-between pb-1 border-b border-gray-50"
                          dir="rtl"
                        >
                          <span className="truncate max-w-[60%]">
                            {h.label}
                          </span>
                          <span className="font-mono text-gray-400">
                            B+{h.blue} R+{h.red} Y+{h.yellow} XP+{h.xp}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h2 className="mb-4 text-base font-semibold text-gray-700">
                    Current Inventory
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Blue Snabel",
                        img: blueImg,
                        count: inv.blue,
                        color: "text-blue-600",
                      },
                      {
                        label: "Red Snabel",
                        img: redImg,
                        count: inv.red,
                        color: "text-red-600",
                      },
                      {
                        label: "Yellow Snabel",
                        img: yellowImg,
                        count: inv.yellow,
                        color: "text-yellow-600",
                      },
                      {
                        label: "Total XP",
                        img: null,
                        count: inv.xp,
                        color: "text-orange-500",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="bg-[#FFF8E5] rounded-xl p-3 flex items-center gap-3"
                      >
                        {item.img ? (
                          <img
                            src={item.img}
                            className="object-contain w-9 h-9"
                            alt=""
                          />
                        ) : (
                          <div className="flex items-center justify-center text-xs font-bold text-orange-500 bg-orange-100 rounded-full w-9 h-9">
                            XP
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400">{item.label}</p>
                          <p className={`text-2xl font-bold ${item.color}`}>
                            {item.count}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Level from Inventory XP
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Level</span>
                      <span className="font-bold text-[#4AAAD6] text-2xl">
                        {invLevel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Medal</span>
                      <div className="flex items-center gap-2">
                        <img
                          src={medalsData[invMedalIndex].img}
                          className="w-6 h-6"
                          alt=""
                        />
                        <span className="text-sm font-medium" dir="rtl">
                          {medalsData[invMedalIndex].title}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#fab70050] rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#F3B14E] h-3 rounded-full transition-all"
                        style={{
                          width: `${
                            invNeeded > 0
                              ? Math.round((invRemaining / invNeeded) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {invRemaining} / {invNeeded} XP in current level
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Reward Rates per Type
                  </h3>
                  <table className="w-full text-xs text-gray-600">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="py-1 text-left">Type</th>
                        <th className="py-1 text-center">Blue</th>
                        <th className="py-1 text-center">Red</th>
                        <th className="py-1 text-center">Yellow</th>
                        <th className="py-1 text-center">XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REWARDS.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1.5 font-medium" dir="rtl">
                            {r.label}
                          </td>
                          <td className="font-bold text-center text-blue-600">
                            +{r.blue}
                          </td>
                          <td className="font-bold text-center text-red-500">
                            +{r.red}
                          </td>
                          <td className="font-bold text-center text-yellow-600">
                            +{r.yellow}
                          </td>
                          <td className="font-bold text-center text-orange-500">
                            +{r.xp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              TREE PREVIEW
          ════════════════════════════════════════════ */}
          {tab === "tree" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Controls */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h2 className="mb-4 text-base font-semibold text-gray-700">
                    Tree Stage Slider
                  </h2>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="font-mono text-2xl font-bold text-green-600">
                      {treeProgress}
                      <span className="text-sm font-normal text-gray-400">
                        {" "}
                        / 51
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={51}
                    value={treeProgress}
                    onChange={(e) => setTreeProgress(Number(e.target.value))}
                    className="w-full accent-green-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>0 (Seed)</span>
                    <span>51 (Final)</span>
                  </div>
                  {isFinalStage && (
                    <p className="mt-2 text-sm font-medium text-green-600">
                      🌳 Final stage reached!
                    </p>
                  )}
                </div>

                {/* Live requirements from real tree data */}
                {currentTreeEntry && (
                  <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                    <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      Requirements for Stage {treeProgress}
                    </h3>
                    <div className="space-y-2">
                      {[
                        { label: "Stage (DB)", value: currentTreeEntry.stage },
                        {
                          label: "Water needed",
                          value: currentTreeEntry.water,
                          img: waterImg,
                        },
                        {
                          label: "Fertilizer needed",
                          value: currentTreeEntry.seeders,
                          img: fertilizerImg,
                        },
                      ].map((row, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            {row.img && (
                              <img src={row.img} className="w-4 h-4" alt="" />
                            )}
                            {row.label}
                          </span>
                          <span className="font-mono font-bold text-gray-700">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tree image */}
              <div className="flex flex-col items-center p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                <h3 className="self-start mb-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Tree Image — treeStages[{treeProgress + 2}]
                </h3>
                <div className="flex items-center justify-center flex-1 w-full">
                  <img
                    src={treeStages[treeProgress + 2]}
                    alt={`Stage ${treeProgress}`}
                    className="max-h-[420px] object-contain"
                  />
                </div>
              </div>

              {/* Full tree data table */}
              <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    All 51 Tree Stages
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[520px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 font-medium text-left text-gray-500">
                          Progress
                        </th>
                        <th className="px-3 py-2 font-medium text-left text-gray-500">
                          Stage
                        </th>
                        <th className="px-3 py-2 font-medium text-center text-gray-500">
                          <img
                            src={waterImg}
                            className="w-4 h-4 mx-auto"
                            alt="water"
                          />
                        </th>
                        <th className="px-3 py-2 font-medium text-center text-gray-500">
                          <img
                            src={fertilizerImg}
                            className="w-4 h-4 mx-auto"
                            alt="fert"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {treeData.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setTreeProgress(row.treeProgress)}
                          className={`border-t border-gray-50 cursor-pointer transition-colors ${
                            row.treeProgress === treeProgress
                              ? "bg-green-50 font-semibold"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono">
                            {row.treeProgress}
                          </td>
                          <td className="px-3 py-1.5">{row.stage}</td>
                          <td className="px-3 py-1.5 text-center text-blue-600 font-bold">
                            {row.water}
                          </td>
                          <td className="px-3 py-1.5 text-center text-amber-700 font-bold">
                            {row.seeders}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              CHALLENGES
          ════════════════════════════════════════════ */}
          {tab === "challenges" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <div>
                  <label className="block mb-1 text-xs text-gray-400">
                    Category
                  </label>
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4AAAD6]"
                  >
                    <option value="all">
                      All Categories ({challengeData.length})
                    </option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat] ?? cat} (
                        {challengeData.filter((c) => c.category === cat).length}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs text-gray-400">
                    Search title / tasktype
                  </label>
                  <input
                    type="text"
                    value={titleFilter}
                    placeholder="e.g. الصلاة"
                    onChange={(e) => setTitleFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4AAAD6] w-56"
                  />
                </div>
                <div className="self-end pb-1 ml-auto text-sm text-gray-400">
                  Showing{" "}
                  <strong className="text-gray-700">
                    {filteredChallenges.length}
                  </strong>{" "}
                  of {challengeData.length}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="overflow-x-auto">
                  <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                    <table className="w-full text-xs whitespace-nowrap">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            ID
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Title
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Task Type
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Category
                          </th>
                          <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">
                            Lvl
                          </th>
                          <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">
                            Milestone
                          </th>
                          <th className="px-3 py-2.5 text-center text-blue-500 font-semibold">
                            <img
                              src={blueImg}
                              className="w-4 h-4 mx-auto"
                              alt="blue"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-center text-red-500 font-semibold">
                            <img
                              src={redImg}
                              className="w-4 h-4 mx-auto"
                              alt="red"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-center text-yellow-500 font-semibold">
                            <img
                              src={yellowImg}
                              className="w-4 h-4 mx-auto"
                              alt="yellow"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-center text-orange-500 font-semibold">
                            XP
                          </th>
                          <th className="px-3 py-2.5 text-center text-cyan-500 font-semibold">
                            <img
                              src={waterImg}
                              className="w-4 h-4 mx-auto"
                              alt="water"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-center text-amber-700 font-semibold">
                            <img
                              src={fertilizerImg}
                              className="w-4 h-4 mx-auto"
                              alt="fert"
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredChallenges.map((c) => (
                          <tr
                            key={c.id}
                            className="border-t border-gray-50 hover:bg-gray-50"
                          >
                            <td className="px-3 py-1.5 font-mono text-gray-400">
                              {c.id}
                            </td>
                            <td
                              className="px-3 py-1.5 font-medium text-gray-700 max-w-[180px] truncate"
                              dir="rtl"
                              title={c.title}
                            >
                              {c.title}
                            </td>
                            <td
                              className="px-3 py-1.5 text-gray-500 max-w-[160px] truncate"
                              dir="rtl"
                              title={c.tasktype ?? ""}
                            >
                              {c.tasktype ?? "—"}
                            </td>
                            <td className="px-3 py-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  CATEGORY_COLORS[c.category] ??
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {c.category}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-center font-mono">
                              {c.level}
                            </td>
                            <td className="px-3 py-1.5 text-center font-mono font-bold">
                              {c.point.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5 text-center text-blue-600 font-bold">
                              {c.snabelBlue || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-center text-red-500 font-bold">
                              {c.snabelRed || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-center text-yellow-600 font-bold">
                              {c.snabelYellow || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-center text-orange-500 font-bold">
                              {c.xp || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-center text-cyan-600 font-bold">
                              {c.water || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-center text-amber-700 font-bold">
                              {c.seeder || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              LEVEL TABLE
          ════════════════════════════════════════════ */}
          {tab === "table" && (
            <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex flex-col justify-between gap-2 px-5 py-4 border-b border-gray-100 sm:flex-row sm:items-center">
                <h2 className="text-base font-semibold text-gray-700">
                  All Level Thresholds (1 – 200)
                </h2>
                <span className="px-3 py-1 font-mono text-xs text-gray-400 rounded-lg bg-gray-50">
                  XP for level n = 10 + 3(n − 1)
                </span>
              </div>
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 240px)" }}
              >
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        Level
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        XP to Advance
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        Total XP to Reach
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
                        Medal Unlocked
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {thresholds.map((row) => {
                      const milestoneMedal = medalsData.find(
                        (m) => m.level === row.level,
                      );
                      return (
                        <tr
                          key={row.level}
                          className={`border-t border-gray-50 ${
                            milestoneMedal ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-2 font-mono font-bold text-gray-700">
                            {row.level}
                          </td>
                          <td className="px-4 py-2 font-mono text-gray-600">
                            {row.xpToAdvance}
                          </td>
                          <td className="px-4 py-2 font-mono text-gray-600">
                            {row.cumulativeXp.toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            {milestoneMedal && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={milestoneMedal.img}
                                  className="w-6 h-6"
                                  alt={milestoneMedal.title}
                                />
                                <span
                                  className="text-xs font-semibold text-blue-700"
                                  dir="rtl"
                                >
                                  {milestoneMedal.title}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
