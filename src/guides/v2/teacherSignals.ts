export type TeacherGuideEvent = 'teacher-selection-ready' | 'teacher-confirm-ready' | 'teacher-assigned-single' | 'teacher-assigned' | 'teacher-completed' | 'teacher-decision-recorded';
type Listener = (event: TeacherGuideEvent) => void;
const listeners = new Set<Listener>();
export const emitTeacherGuideEvent = (event: TeacherGuideEvent) => listeners.forEach(listener => listener(event));
export const subscribeTeacherGuideEvents = (listener: Listener) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** HTTP 200 may contain only failed/unauthorized rows. Require actual success. */
export const teacherMutationEvent = (action: 'assign' | 'complete', count: number, response: any): TeacherGuideEvent | null => {
  const valid = action === 'assign' ? ['created', 'existing'] : ['completed', 'already_completed'];
  const successful = Array.isArray(response?.results)
    ? response.results.filter((row: any) => valid.includes(row.status)).length
    : valid.reduce((sum, status) => sum + (Number(response?.summary?.[status]) || 0), 0);
  if (successful <= 0) return null;
  return action === 'complete' ? 'teacher-completed' : count === 1 && successful === 1 ? 'teacher-assigned-single' : 'teacher-assigned';
};
