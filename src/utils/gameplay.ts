import { calculateLevel } from "./LevelCalculator";
import { toFiniteNumber } from "./numericData";

export type GameplayAction = "mission" | "purchase" | "tree";
export const gameplayEndpoints = {
  mission: { method: "post", path: "add-pros" },
  purchase: { method: "patch", path: "buy-water-seeder" },
  tree: { method: "patch", path: "grow-tree" },
} as const;

export function gameplaySound(action: GameplayAction, previousXp: number, nextXp: number) {
  if (calculateLevel(nextXp).level > calculateLevel(previousXp).level) return "levelUp";
  return action === "purchase" ? "success" : "reward";
}

// Only committed gameplay fields are merged. Profile/class/organization data
// remains owned by the authenticated profile endpoint.
export function reconcileGameplay<T extends { id: number; completedTasks?: { date: string; taskIds: number[] } }>(previous: T, result: any): T {
  const student = result.student;
  if (!student || Number(student.id) !== previous.id) throw new Error("Student response does not match the signed-in student");
  const next: any = { ...previous };
  for (const key of ["xp", "snabelRed", "snabelBlue", "snabelYellow", "water", "treeProgress"]) {
    if (student[key] !== undefined) next[key] = toFiniteNumber(student[key]);
  }
  next.fertilizer = toFiniteNumber(student.seeders);
  if (result.treePoint) {
    next.waterNeeded = toFiniteNumber(result.treePoint.water);
    next.fertilizerNeeded = toFiniteNumber(result.treePoint.seeders);
    next.treeStage = toFiniteNumber(result.treePoint.stage);
  }
  if (result.completion) {
    const { date, taskId } = result.completion;
    const ids = previous.completedTasks?.date === date ? (previous.completedTasks?.taskIds ?? []) : [];
    next.completedTasks = { date, taskIds: [...new Set([...ids, Number(taskId)])] };
  }
  return next;
}
