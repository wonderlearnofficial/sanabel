import { GuideRegistryEntry } from './types';
import { PredicateFacts } from './predicates';
import { requestGuideView } from './GuideViewController';
import { activeGuideViews } from './viewRegistry';

export const teacherRegistryForRoute = (registry: GuideRegistryEntry[], path: string) => registry.map(entry =>
  entry.id === 'teacher-first-assignment' && path === '/teacher/studentslist' ? { ...entry, route: path } : entry);

/** Resume the explanation, but rebuild transient selection using the real UI. */
export const teacherResumeIndex = (saved: number, path: string, facts: PredicateFacts) => {
  if (saved === 5) return saved; // a successful assignment already reached its recap
  if (saved > 1 && facts.teacherWizardOpen !== true) return 1;
  return path === '/teacher/studentslist' ? Math.max(1, saved) : saved;
};

export const waitForTeacherReplay = async (entry: GuideRegistryEntry, cancelled: () => boolean): Promise<boolean> => {
  const target = entry.replayTarget ?? { route: entry.route, view: entry.view };
  const started = Date.now();
  while (!cancelled() && Date.now() - started < 8000) {
    if (window.location.pathname === target.route) {
      const viewReady = !target.view || activeGuideViews().includes(target.view);
      if (!viewReady) requestGuideView(target.view);
      const ids = entry.prerequisites.filter(p => p.kind === 'target').map(p => p.id);
      if (entry.steps[0]?.targetId) ids.push(entry.steps[0].targetId);
      const ready = ids.every(id => Array.from(document.querySelectorAll<HTMLElement>(`[data-guide-id="${id}"]`)).some(element => !element.matches(':disabled') && element.getClientRects().length > 0));
      if (viewReady && ready) return true;
    }
    await new Promise(resolve => window.setTimeout(resolve, 150));
  }
  return false;
};
