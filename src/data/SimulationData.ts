// ─── Types ────────────────────────────────────────────────────────────────────

export enum TaskCategory {
  task = "task",
  treestage = "treestage",
  treelevel = "treelevel",
  alltask = "alltask",
  snabelBlue = "snabelBlue",
  snabelYellow = "snabelYellow",
  snabelRed = "snabelRed",
  snabelMixed = "snabelMixed",
  xp = "xp",
  water = "water",
  seeder = "seeder",
  tasktype = "tasktype",
}

export interface ChallengeEntry {
  id: number;
  title: string;
  description: string;
  level: number;
  snabelBlue: number;
  snabelYellow: number;
  snabelRed: number;
  xp: number;
  point: number;
  category: TaskCategory;
  taskCategory: string | null;
  tasktype: string | null;
  water: number;
  seeder: number;
}

export interface TreeEntry {
  id: number;
  treeProgress: number;
  water: number;
  seeders: number;
  stage: number;
}

// ─── Generator ────────────────────────────────────────────────────────────────

let _id = 1;

const gen = (
  title: string,
  cfg: {
    blue: number; yellow: number; red: number; xp: number;
    trophyMilestones: number[];
    xpMultiplier: number;
    blueMultiplier: number; yellowMultiplier: number; redMultiplier: number;
    water?: number; seeder?: number;
  },
  category: TaskCategory,
  taskCategory?: string,
  tasktype?: string
): ChallengeEntry[] =>
  cfg.trophyMilestones.map((milestone, index) => ({
    id: _id++,
    title,
    description: `Complete ${milestone} tasks to unlock this challenge.`,
    level: index + 1,
    snabelBlue: Math.ceil(cfg.blue * cfg.blueMultiplier * milestone),
    snabelYellow: Math.ceil(cfg.yellow * cfg.yellowMultiplier * milestone),
    snabelRed: Math.ceil(cfg.red * cfg.redMultiplier * milestone),
    xp: Math.ceil(cfg.xp * cfg.xpMultiplier * milestone),
    point: milestone,
    category,
    taskCategory: taskCategory ?? null,
    tasktype: tasktype ?? null,
    water: cfg.water ? Math.ceil((cfg.water * milestone) / 10) : 0,
    seeder: cfg.seeder ? Math.ceil((cfg.seeder * milestone) / 10) : 0,
  }));

// ─── Milestones ───────────────────────────────────────────────────────────────

export const milestones = {
  treeStage:            [2, 3, 4],
  progressTree:         [1, 5, 10, 15, 30, 40],
  missionsFinished:     [1, 5, 10, 25, 50, 75, 100, 150, 250, 500, 750, 1000],
  totalBluePoints:      [5, 10, 25, 50, 100, 250, 500, 1000],
  totalYellowPoints:    [5, 10, 25, 50, 100, 250, 500, 1000],
  totalRedPoints:       [5, 10, 25, 50, 100, 250, 500, 1000],
  totalMixedPoints:     [10, 25, 50, 100, 250, 500, 750, 1000, 2500],
  totalXP:              [100, 250, 500, 1000, 2500, 5000, 7500, 10000, 25000],
  totalWaterBought:     [5, 10, 25, 50, 75, 100, 150],
  totalFertilizerBought:[5, 10, 25, 50, 75, 100],
};

// ─── Challenge Data ───────────────────────────────────────────────────────────

export const challengeData: ChallengeEntry[] = [
  // ── Category challenges ──────────────────────────────────────────────────
  ...gen("العلاقة مع الله",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100,500,1000],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.task, "سنابل الإحسان في العلاقة مع الله"),

  ...gen("العلاقة مع النفس",
    { blue:2,yellow:1,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.task, "سنابل الإحسان في العلاقة مع النفس"),

  ...gen("العلاقة مع الأسرة والمجتمع",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.task, "سنابل الإحسان في العلاقة مع الأسرة والمجتمع"),

  ...gen("العلاقة مع الأرض والكون",
    { blue:1,yellow:1,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.task, "سنابل الإحسان في العلاقة مع الأرض والكون"),

  // ── Tree milestones ──────────────────────────────────────────────────────
  ...gen("Tree Stage",
    { blue:10,yellow:10,red:10,xp:30, trophyMilestones:milestones.treeStage,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.treestage, "Tree Stage Milestones"),

  ...gen("Progress Tree",
    { blue:10,yellow:10,red:10,xp:50, trophyMilestones:milestones.progressTree,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.treelevel, "Progress Tree Milestones"),

  // ── Aggregate milestones ─────────────────────────────────────────────────
  ...gen("Missions Finished",
    { blue:1,yellow:1,red:1,xp:1, trophyMilestones:milestones.missionsFinished,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.alltask, "Missions Finished Milestones"),

  ...gen("Total Blue Points",
    { blue:1,yellow:0,red:0,xp:0, trophyMilestones:milestones.totalBluePoints,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.snabelBlue, "Total Blue Points Milestones"),

  ...gen("Total Yellow Points",
    { blue:0,yellow:1,red:0,xp:0, trophyMilestones:milestones.totalYellowPoints,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.snabelYellow, "Total Yellow Points Milestones"),

  ...gen("Total Red Points",
    { blue:0,yellow:0,red:1,xp:0, trophyMilestones:milestones.totalRedPoints,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.snabelRed, "Total Red Points Milestones"),

  ...gen("Total Mixed Points",
    { blue:2,yellow:2,red:2,xp:0, trophyMilestones:milestones.totalMixedPoints,
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.snabelMixed, "Total Mixed Points Milestones"),

  ...gen("Total XP",
    { blue:0,yellow:0,red:0,xp:20, trophyMilestones:milestones.totalXP,
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.xp, "Total XP Milestones"),

  ...gen("Total Water Bought",
    { blue:0,yellow:0,red:0,xp:0, water:1, trophyMilestones:milestones.totalWaterBought,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.water, "Total Water Bought Milestones"),

  ...gen("Total Fertilizer Bought",
    { blue:0,yellow:0,red:0,xp:0, seeder:1, trophyMilestones:milestones.totalFertilizerBought,
      xpMultiplier:1, blueMultiplier:1, yellowMultiplier:1, redMultiplier:1 },
    TaskCategory.seeder, "Total Fertilizer Bought Milestones"),

  // ── Per task-type challenges ──────────────────────────────────────────────
  // With الله group (blue:2,yellow:2,red:2,xp:5, mult: 0.6*0.5 each)
  ...gen("الصلاة",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100,150,250,500,750,1000],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الصلاة"),

  ...gen("الصيام",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الصيام"),

  ...gen("الصدقة",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الصدقة"),

  ...gen("العفو والصفح",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "العفو والصفح"),

  ...gen("الشكر",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الشكر"),

  ...gen("الصبر",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الصبر"),

  ...gen("الذكر",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الذكر"),

  ...gen("الدعاء",
    { blue:2,yellow:2,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الدعاء"),

  // مع النفس group (blue:2,yellow:1,red:1, mult: 0.6*0.5 blue, 0.3*0.5 others)
  ...gen("الإحسان للجسد",
    { blue:2,yellow:1,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإحسان للجسد"),

  ...gen("الإحسان للعقل",
    { blue:2,yellow:1,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإحسان للعقل"),

  ...gen("الإحسان للروح",
    { blue:2,yellow:1,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإحسان للروح"),

  ...gen("الإحسان للقلب",
    { blue:2,yellow:1,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.6*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإحسان للقلب"),

  // مع الأسرة group (blue:1,yellow:2,red:1, mult: 0.3*0.5 blue/red, 0.6*0.5 yellow)
  ...gen("بر الوالدين",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "بر الوالدين"),

  ...gen("صلة الرحم",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "صلة الرحم"),

  ...gen("الصدق والأمانة",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الصدق والأمانة"),

  ...gen("إكرام الضيف",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "إكرام الضيف"),

  ...gen("الإحسان للجار",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإحسان للجار"),

  ...gen("توقير الكبير ورحمة الصغير",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "توقير الكبير ورحمة الصغير"),

  ...gen("التهادي",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "التهادي"),

  ...gen("الإطعام",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإطعام"),

  ...gen("الرحمة والرفق",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الرحمة والرفق"),

  ...gen("الوفاء والامتنان",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الوفاء والامتنان"),

  ...gen("إدخال السرور",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "إدخال السرور"),

  ...gen("إيناس الوحشان وترك التناجي",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "إيناس الوحشان وترك التناجي"),

  ...gen("الإصلاح بين متخاصمين",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الإصلاح بين متخاصمين"),

  ...gen("التبسم وإفشاء السلام",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "التبسم وإفشاء السلام"),

  ...gen("إماطة الأذى عن الطريق",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "إماطة الأذى عن الطريق"),

  ...gen("التعاون",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "التعاون"),

  ...gen("الكلمة الطيبة والإحسان في القول",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "الكلمة الطيبة والإحسان في القول"),

  ...gen("المشاركة والإيثار",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "المشاركة والإيثار"),

  ...gen("قضاء الحوائج ومساعدة الآخرين",
    { blue:1,yellow:2,red:1,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.6*0.5, redMultiplier:0.3*0.5 },
    TaskCategory.tasktype, undefined, "قضاء الحوائج ومساعدة الآخرين"),

  // مع الأرض group (blue:1,yellow:1,red:2, mult: 0.3*0.5 blue/yellow, 0.6*0.5 red)
  ...gen("عدم الإسراف",
    { blue:1,yellow:1,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "عدم الإسراف"),

  ...gen("الاحسان للمخلوقات (الطيور والحيوانات)",
    { blue:1,yellow:1,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الاحسان للمخلوقات (الطيور والحيوانات)"),

  ...gen("الغرس",
    { blue:1,yellow:1,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الغرس"),

  ...gen("الإحسان للأرض والنبات",
    { blue:1,yellow:1,red:2,xp:5, trophyMilestones:[1,5,10,25,50,75,100],
      xpMultiplier:1, blueMultiplier:0.3*0.5, yellowMultiplier:0.3*0.5, redMultiplier:0.6*0.5 },
    TaskCategory.tasktype, undefined, "الإحسان للأرض والنبات"),
];

// ─── Tree Data ────────────────────────────────────────────────────────────────

export const treeData: TreeEntry[] = [
  { id:  1, treeProgress:  1, water:  1, seeders:  1, stage: 1 },
  { id:  2, treeProgress:  2, water:  1, seeders:  1, stage: 1 },
  { id:  3, treeProgress:  3, water:  1, seeders:  1, stage: 1 },
  { id:  4, treeProgress:  4, water:  1, seeders:  1, stage: 1 },
  { id:  5, treeProgress:  5, water:  5, seeders:  5, stage: 1 },
  { id:  6, treeProgress:  6, water:  2, seeders:  2, stage: 2 },
  { id:  7, treeProgress:  7, water:  2, seeders:  2, stage: 2 },
  { id:  8, treeProgress:  8, water:  2, seeders:  2, stage: 2 },
  { id:  9, treeProgress:  9, water:  2, seeders:  2, stage: 2 },
  { id: 10, treeProgress: 10, water:  2, seeders:  2, stage: 2 },
  { id: 11, treeProgress: 11, water:  3, seeders:  2, stage: 2 },
  { id: 12, treeProgress: 12, water:  3, seeders:  2, stage: 2 },
  { id: 13, treeProgress: 13, water:  3, seeders:  2, stage: 2 },
  { id: 14, treeProgress: 14, water:  3, seeders:  2, stage: 2 },
  { id: 15, treeProgress: 15, water: 10, seeders: 10, stage: 2 },
  { id: 16, treeProgress: 16, water:  4, seeders:  3, stage: 3 },
  { id: 17, treeProgress: 17, water:  4, seeders:  3, stage: 3 },
  { id: 18, treeProgress: 18, water:  4, seeders:  3, stage: 3 },
  { id: 19, treeProgress: 19, water:  4, seeders:  3, stage: 3 },
  { id: 20, treeProgress: 20, water:  4, seeders:  3, stage: 3 },
  { id: 21, treeProgress: 21, water:  4, seeders:  3, stage: 3 },
  { id: 22, treeProgress: 22, water:  4, seeders:  3, stage: 3 },
  { id: 23, treeProgress: 23, water:  4, seeders:  3, stage: 3 },
  { id: 24, treeProgress: 24, water:  5, seeders:  3, stage: 3 },
  { id: 25, treeProgress: 25, water:  5, seeders:  3, stage: 3 },
  { id: 26, treeProgress: 26, water:  5, seeders:  3, stage: 3 },
  { id: 27, treeProgress: 27, water:  5, seeders:  3, stage: 3 },
  { id: 28, treeProgress: 28, water:  5, seeders:  3, stage: 3 },
  { id: 29, treeProgress: 29, water:  5, seeders:  3, stage: 3 },
  { id: 30, treeProgress: 30, water: 15, seeders: 15, stage: 3 },
  { id: 31, treeProgress: 31, water:  6, seeders:  4, stage: 4 },
  { id: 32, treeProgress: 32, water:  6, seeders:  4, stage: 4 },
  { id: 33, treeProgress: 33, water:  6, seeders:  4, stage: 4 },
  { id: 34, treeProgress: 34, water:  6, seeders:  4, stage: 4 },
  { id: 35, treeProgress: 35, water:  6, seeders:  4, stage: 4 },
  { id: 36, treeProgress: 36, water:  6, seeders:  4, stage: 4 },
  { id: 37, treeProgress: 37, water:  7, seeders:  4, stage: 4 },
  { id: 38, treeProgress: 38, water:  7, seeders:  4, stage: 4 },
  { id: 39, treeProgress: 39, water:  7, seeders:  4, stage: 4 },
  { id: 40, treeProgress: 40, water:  7, seeders:  4, stage: 4 },
  { id: 41, treeProgress: 41, water:  7, seeders:  4, stage: 4 },
  { id: 42, treeProgress: 42, water:  7, seeders:  4, stage: 4 },
  { id: 43, treeProgress: 43, water:  7, seeders:  4, stage: 4 },
  { id: 44, treeProgress: 44, water:  7, seeders:  4, stage: 4 },
  { id: 45, treeProgress: 45, water:  7, seeders:  4, stage: 4 },
  { id: 46, treeProgress: 46, water:  7, seeders:  4, stage: 4 },
  { id: 47, treeProgress: 47, water:  7, seeders:  4, stage: 4 },
  { id: 48, treeProgress: 48, water:  7, seeders:  4, stage: 4 },
  { id: 49, treeProgress: 49, water:  7, seeders:  4, stage: 4 },
  { id: 50, treeProgress: 50, water: 20, seeders: 20, stage: 4 },
  { id: 51, treeProgress: 51, water:  0, seeders:  0, stage: 4 },
];
