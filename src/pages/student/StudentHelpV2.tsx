import { useEffect, useRef } from 'react';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GoBackButton from '../../components/GoBackButton';
import { useOptionalGuideV2 } from '../../guides/v2/GuideProviderV2';
import { STUDENT_GUIDES, studentGuideVisual, studentVisuals } from '../../guides/v2/studentContent';
import { ExperienceContext } from '../../guides/v2/types';
import { PredicateFacts } from '../../guides/v2/predicates';
import { evaluatePredicate } from '../../guides/v2/predicates';
import { studentGuideAllowed } from '../../guides/v2/studentReplay';
import GuideReplayList from '../../guides/GuideReplayList';

export const studentHelpGuides = (context: ExperienceContext, facts: PredicateFacts) =>
  STUDENT_GUIDES.filter(guide => studentGuideAllowed(guide, context, facts));
export const studentReplayGuides = (context: ExperienceContext, facts: PredicateFacts) =>
  studentHelpGuides(context, facts).filter(guide => {
    if (guide.autoTrigger.kind === 'predicate' && !evaluatePredicate(guide.autoTrigger.id, { context, facts })) return false;
    if (guide.id === 'school-approval-lifecycle') return (facts.approvedApprovalCount ?? 0) > 0;
    if (guide.id === 'school-approval-denied') return (facts.deniedApprovalCount ?? 0) > 0;
    if (guide.id === 'school-approval-pending') return (facts.pendingApprovalCount ?? 0) > 0;
    if (guide.id === 'school-todo') return (facts.assignedMissionCount ?? 0) > 0;
    return guide.replayable;
  });

export default function StudentHelpV2() {
  const guides = useOptionalGuideV2();
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const articleRef = useRef<HTMLElement>(null);
  const topicId = new URLSearchParams(search).get('topic');
  useEffect(() => { if (topicId) articleRef.current?.focus(); }, [topicId]);
  if (!guides || !['solo', 'school-student'].includes(guides.context.experience)) return <Redirect to="/student/home" />;
  const topics = studentHelpGuides(guides.context, guides.facts);
  const topic = topics.find(item => item.id === topicId);
  const replay = studentReplayGuides(guides.context, guides.facts);
  return <main dir={i18n.language.startsWith('en') ? 'ltr' : 'rtl'} className="h-full overflow-y-auto bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-white">
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <GoBackButton />
      <h1 className="text-2xl font-bold">{t('tutorial.student.helpTitle')}</h1>
      {topicId && <article ref={articleRef} tabIndex={-1} className="space-y-3 rounded-xl border p-4 focus-visible:ring-2">
        {(!topic || new URLSearchParams(search).has('fallback')) && <p role="status">{t('tutorial.student.unavailable')}</p>}
        {topic?.steps.map(step => {
          const copy = step.rewardModeCopy?.[guides.context.rewardMode] ?? step;
          const visual = studentGuideVisual(step.id);
          return <section key={step.id} className="space-y-2">
            <h2 className="text-lg font-bold">{t(copy.titleKey)}</h2>
            {copy.descriptionKey && <p>{t(copy.descriptionKey)}</p>}
            {visual && <div className="grid grid-cols-2 gap-3">{studentVisuals[visual].map(item => <figure key={item.label} className="text-center"><img src={item.src} alt="" className="mx-auto h-14 w-14 object-contain" /><figcaption>{t(`tutorial.student.${item.label}`)}</figcaption></figure>)}</div>}
          </section>;
        })}
      </article>}
      <section><h2 className="mb-2 text-xl font-bold">{t('tutorial.student.topics')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link className="flex min-h-[44px] items-center rounded-xl border p-3 focus-visible:ring-2" to="/help?topic=solo-reward-xp&section=balances">{t('tutorial.student.balancesTitle')}</Link>
          {topics.filter(item => item.priority !== 'orientation').map(item =>
          <Link className="flex min-h-[44px] items-center rounded-xl border p-3 focus-visible:ring-2" key={item.id} to={`/help?topic=${item.id}`}>{t(item.steps[item.priority === 'first-success' ? 2 : 0].titleKey)}</Link>)}</div>
      </section>
      <section><h2 className="mb-2 text-xl font-bold">{t('tutorial.student.replay')}</h2>
        {guides.enabled ? <div className="grid gap-2 sm:grid-cols-2">{replay.map(item => <button key={item.id} type="button" className="min-h-[44px] rounded-xl border p-3 text-start focus-visible:ring-2" onClick={() => guides.replayGuide(item.id)}>{t(item.steps[0].titleKey)}</button>)}</div>
          : <Link to="/student/settings/guides" className="inline-flex min-h-[44px] items-center underline">{t('tutorial.student.replay')}</Link>}
      </section>
      <section className="space-y-3"><h2 className="text-xl font-bold">{t('tutorial.student.account')}</h2>
        <p>{t('tutorial.student.accountBody')}</p><p>{t('tutorial.student.supportBody')}</p>
        <Link to="/student/profile" className="inline-flex min-h-[44px] items-center underline">{t('tutorial.student.profileTitle')}</Link>
      </section>
    </div>
  </main>;
}

/** Preserve Phase 0 replay when V2 is off, and the old bookmarked route. */
export function StudentReplayCompatibility() {
  const guides = useOptionalGuideV2();
  return guides?.enabled ? <Redirect to="/help" /> : <GuideReplayList role="Student" />;
}
