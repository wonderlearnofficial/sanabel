// Only the dedicated local Vite test config aliases this module. No real account/API.
export const useUserContext = () => ({ user: {
  id: 700001, role: 'Parent', organizationId: null, classId: null,
  accountCreatedAt: '2026-09-09T00:00:00Z', seenGuides: [], xp: 23,
  water: 2, fertilizer: 2, waterNeeded: 1, fertilizerNeeded: 1,
} });
