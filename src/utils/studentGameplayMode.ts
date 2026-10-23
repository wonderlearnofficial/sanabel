/** Mirrors the server's mission-completion policy. Organization members use
 * approval even without a class. A class-only legacy record fails closed;
 * class features such as the leaderboard still check classId separately.
 */
export const requiresMissionApproval = (student: {
  organizationId?: number | null;
  classId?: number | null;
} | null | undefined): boolean =>
  student?.organizationId != null || student?.classId != null;
