// Only the dedicated local Vite test config aliases this module. No real account/API.
export const useUserContext = () => ({ user: {
  id: 700002, role: 'Teacher', organizationId: 11, classId: null,
  accountCreatedAt: '2026-09-09T00:00:00Z', seenGuides: [],
} });
