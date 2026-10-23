import { useEffect, useRef } from 'react';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOptionalGuideV2 } from '../../guides/v2/GuideProviderV2';
import { TEACHER_GUIDES } from '../../guides/v2/teacherContent';
import { ExperienceContext } from '../../guides/v2/types';
import { PredicateFacts, evaluatePredicate } from '../../guides/v2/predicates';
import GuideReplayList from '../../guides/GuideReplayList';
import StudentHelpV2 from '../student/StudentHelpV2';
import Loading from '../../components/Loading';
import { useUserContext } from '../../context/StudentUserProvider';

export const teacherHelpGuides = (context: ExperienceContext) => context.experience === 'teacher' ? TEACHER_GUIDES : [];
export const teacherReplayGuides = (context: ExperienceContext, facts: PredicateFacts) => teacherHelpGuides(context).filter(entry =>
  [...entry.prerequisites, entry.autoTrigger].every(p => p.kind !== 'predicate' || evaluatePredicate(p.id, { context, facts })));

export default function TeacherHelpV2() {
  const guides = useOptionalGuideV2();
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const article = useRef<HTMLElement>(null);
  const topicId = new URLSearchParams(search).get('topic');
  useEffect(() => { if (topicId) article.current?.focus(); }, [topicId]);
  if (guides?.context.experience !== 'teacher') return <Redirect to="/" />;
  const topics = teacherHelpGuides(guides.context);
  const topic = topics.find(entry => entry.id === topicId);
  const replay = teacherReplayGuides(guides.context, guides.facts);
  return <main dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'} className="h-full overflow-y-auto bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-white">
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <Link to="/teacher/home" className="inline-flex min-h-[44px] items-center underline">{t('tutorial.teacher.welcomeTitle')}</Link>
      <h1 className="text-2xl font-bold">{t('tutorial.teacher.helpTitle')}</h1>
      {(guides.facts.teacherStudentCount ?? 0) === 0 && <p>{t('tutorial.teacher.emptyBody')}</p>}
      {(guides.facts.teacherPendingCount ?? 0) === 0 && <p>{t('tutorial.teacher.noPending')}</p>}
      {topicId && <article ref={article} tabIndex={-1} className="space-y-3 rounded-xl border p-4 focus-visible:ring-2">
        {(!topic || new URLSearchParams(search).has('fallback')) && <p role="status">{t('tutorial.teacher.unavailable')}</p>}
        {topic?.steps.map(step => <section key={step.id} className="space-y-2"><h2 className="text-lg font-bold">{t(step.titleKey)}</h2><p>{t(step.descriptionKey!)}</p></section>)}
      </article>}
      <section><h2 className="mb-2 text-xl font-bold">{t('tutorial.teacher.topics')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">{topics.filter(entry => entry.priority !== 'orientation').map(entry =>
          <Link key={entry.id} to={`/teacher/help?topic=${entry.id}`} className="flex min-h-[44px] items-center rounded-xl border p-3 focus-visible:ring-2">{t(entry.steps[0].titleKey)}</Link>)}</div>
      </section>
      <section><h2 className="mb-2 text-xl font-bold">{t('tutorial.teacher.replay')}</h2>
        {guides.enabled ? <div className="grid gap-2 sm:grid-cols-2">{replay.map(entry => <button key={entry.id} type="button" className="min-h-[44px] rounded-xl border p-3 text-start focus-visible:ring-2" onClick={() => guides.replayGuide(entry.id)}>{t(entry.steps[0].titleKey)}</button>)}</div>
          : <GuideReplayList role="Teacher" />}
      </section>
      <section><h2 className="text-xl font-bold">{t('tutorial.teacher.accountTitle')}</h2><p>{t('tutorial.teacher.accountBody')}</p></section>
    </div>
  </main>;
}

/** Teacher-only dispatch leaves the accepted Student Help implementation intact. */
export function TeacherHelpDispatch() {
  const guides = useOptionalGuideV2();
  const { user, isLoading } = useUserContext();
  // Until the account loads, the role is unknown. Choosing a page now would
  // render Student help (and call Student endpoints) for a Teacher or Parent.
  if (isLoading && !user) return <Loading />;
  return guides?.context.experience === 'teacher' ? <TeacherHelpV2 /> : <StudentHelpV2 />;
}
export function TeacherReplayCompatibility() {
  const guides = useOptionalGuideV2();
  return guides?.context.experience === 'teacher' && guides.enabled ? <Redirect to="/teacher/help" /> : <GuideReplayList role={localStorage.getItem('role') === 'Parent' ? 'Parent' : 'Teacher'} />;
}
