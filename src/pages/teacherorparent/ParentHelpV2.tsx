import { useEffect, useRef } from 'react';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOptionalGuideV2 } from '../../guides/v2/GuideProviderV2';
import { PARENT_GUIDES } from '../../guides/v2/parentContent';
import { studentGuideAllowed } from '../../guides/v2/studentReplay';
import { ExperienceContext } from '../../guides/v2/types';
import { PredicateFacts } from '../../guides/v2/predicates';
import GoBackButton from '../../components/GoBackButton';

/** Preserve existing destinations for every other experience. */
export function ParentHelpDispatch({ children }: { children: React.ReactNode }) {
  const guides = useOptionalGuideV2();
  return guides?.enabled && guides.context.experience === 'parent' ? <ParentHelpV2 /> : <>{children}</>;
}

export const parentReplayGuides = (context: ExperienceContext, facts: PredicateFacts) =>
  PARENT_GUIDES.filter(entry => studentGuideAllowed(entry, context, facts));
export default function ParentHelpV2() {
  const guides = useOptionalGuideV2();
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const article = useRef<HTMLElement>(null);
  const topicId = new URLSearchParams(search).get('topic');
  useEffect(() => { if (topicId) article.current?.focus(); }, [topicId]);
  if (guides?.context.experience !== 'parent') return <Redirect to="/" />;
  const topic = PARENT_GUIDES.find(entry => entry.id === topicId);
  const replay = parentReplayGuides(guides.context, guides.facts);
  const topics = ['parent-first-link', 'parent-child-progress', 'parent-approval-pending', 'parent-child-switch'];
  return <main dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'} className="h-full overflow-y-auto bg-white p-4 text-gray-900">
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <GoBackButton /><h1 className="text-2xl font-bold">{t('tutorial.parent.help')}</h1>
      {topicId && <article ref={article} tabIndex={-1} className="space-y-3 rounded-xl border p-4 focus-visible:ring-2">
        {(!topic || new URLSearchParams(search).has('fallback')) && <p role="status">{t('tutorial.parent.unavailable')}</p>}
        {topic?.steps.map(step => <section key={step.id}><h2 className="text-lg font-bold">{t(step.titleKey)}</h2><p>{step.descriptionKey && t(step.descriptionKey)}</p></section>)}
      </article>}
      <p>{t('tutorial.parent.connectBody')}</p><p>{t('tutorial.parent.linkedBody')}</p>
      <div className="grid gap-3 sm:grid-cols-2">{topics.map(id => {
        const entry = PARENT_GUIDES.find(item => item.id === id)!;
        return <section key={id} className="space-y-2 rounded-xl border p-3">
          <Link className="flex min-h-[44px] items-center font-bold underline focus-visible:ring-2" to={`/parent/help?topic=${id}`}>{t(entry.steps[0].titleKey)}</Link>
          <p>{t(entry.steps[0].descriptionKey!)}</p>
          {guides.enabled && replay.some(item => item.id === id) && <button type="button" className="min-h-[44px] rounded-lg border px-4 focus-visible:ring-2" onClick={() => guides.replayGuide(id)}>{t('tutorial.parent.replay')}</button>}
        </section>;
      })}</div>
      {guides.enabled && replay.filter(entry => entry.priority === 'orientation' || entry.id === 'parent-first-progress').map(entry => <button key={entry.id} className="min-h-[44px] rounded-xl border p-3 focus-visible:ring-2" onClick={() => guides.replayGuide(entry.id)}>{t(entry.steps[0].titleKey)} — {t('tutorial.parent.replay')}</button>)}
      <section className="space-y-3"><h2 className="text-xl font-bold">{t('tutorial.parent.account')}</h2><p>{t('tutorial.parent.accountBody')}</p>
        <Link to="/teacher/profile" className="inline-flex min-h-[44px] items-center underline">{t('tutorial.parent.settings')}</Link>
      </section>
    </div>
  </main>;
}
