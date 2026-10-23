import { GuideRegistryEntry, ExperienceContext } from './types';
import { PredicateFacts, evaluatePredicate } from './predicates';
import { requestGuideView } from './GuideViewController';
import { activeGuideViews } from './viewRegistry';

export const studentGuideAllowed = (entry: GuideRegistryEntry, context: ExperienceContext, facts: PredicateFacts) =>
  entry.experiences.includes(context.experience) && entry.prerequisites.every(p =>
    p.kind !== 'predicate' || evaluatePredicate(p.id, { context, facts }));

/** Bounded navigation → view selection → visible target wait. Never calls gameplay. */
export const waitForStudentReplay = async (entry: GuideRegistryEntry, cancelled: () => boolean): Promise<boolean> => {
  const target = entry.replayTarget ?? { route: entry.route, view: entry.view };
  const started = Date.now();
  while (!cancelled() && Date.now() - started < 8000) {
    if (window.location.pathname === target.route) {
      const viewReady = !target.view || activeGuideViews().includes(target.view);
      if (!viewReady) requestGuideView(target.view);
      const ids = [...entry.prerequisites.filter(p => p.kind === 'target').map(p => p.id)];
      const first = entry.steps[0]?.targetId;
      if (first) ids.push(first);
      const targetsReady = ids.every(id => {
        const element = document.querySelector<HTMLElement>(`[data-guide-id="${id}"]`);
        return element && !element.matches(':disabled') && element.getClientRects().length > 0;
      });
      if (viewReady && targetsReady) return true;
    }
    await new Promise(resolve => window.setTimeout(resolve, 150));
  }
  return false;
};
