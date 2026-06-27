// utils/levelCalculator.ts
export const calculateLevel = (totalXp: number) => {
  const baseXp = 10;
  const increment = 3;
  let level = 1;
  let xpForNextLevel = baseXp;

  while (totalXp >= xpForNextLevel) {
    totalXp -= xpForNextLevel;
    level++;
    xpForNextLevel = baseXp + increment * (level - 1);
  }
  return { level, remainingXp: totalXp, xpForNextLevel };
};
