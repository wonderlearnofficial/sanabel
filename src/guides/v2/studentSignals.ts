export type StudentGuideSignal =
  | { type: 'mission-completed' | 'approval-sent' | 'tree-grown' | 'no-approver' }
  | { type: 'dialog'; open: boolean };
const listeners = new Set<(signal: StudentGuideSignal) => void>();
/** Screens emit only after their existing request succeeds. No gameplay calls here. */
export const emitStudentGuideSignal = (signal: StudentGuideSignal) => {
  listeners.forEach(listener => listener(signal));
};
export const subscribeStudentGuideSignals = (listener: (signal: StudentGuideSignal) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const isNoApproverError = (error: unknown): boolean => {
  const data = (error as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
  return data?.code === 'NO_ELIGIBLE_APPROVER' || data?.code === 'NO_APPROVER'
    || /^No parent or teacher\b/i.test(data?.message ?? '');
};
