export type ParentGuideEvent = 'child-linked' | 'parent-approval-decided' | 'parent-progress-opened';
const listeners = new Set<(event: ParentGuideEvent) => void>();
/** Emitted by the real UI after success; contains no relationship/reward mutation. */
export const emitParentGuideEvent = (event: ParentGuideEvent) => listeners.forEach(listener => listener(event));
export const subscribeParentGuideEvents = (listener: (event: ParentGuideEvent) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
