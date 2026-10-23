import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useOptionalGuideV2 } from './GuideProviderV2';
import { registerHelpTopicOpener } from './helpFallback';
import { publishGuideFacts } from './facts';
import { subscribeTeacherGuideEvents } from './teacherSignals';

/** Observes page-owned state and successful requests. Never performs gameplay. */
export default function TeacherGuideBridge() {
  const guides = useOptionalGuideV2();
  const history = useHistory();
  const teacher = guides?.context.experience === 'teacher';
  useEffect(() => {
    if (!teacher) return;
    registerHelpTopicOpener(topic => { history.push(`/teacher/help?topic=${encodeURIComponent(topic)}&fallback=1`); return true; });
    return () => registerHelpTopicOpener(null);
  }, [teacher, history]);
  useEffect(() => {
    if (!teacher) return;
    return () => publishGuideFacts({ teacherStudentCount: 0, teacherClassCount: 0, teacherPendingCount: 0, teacherSelectedCount: 0, teacherWizardOpen: false, teacherConfirming: false, teacherAction: undefined });
  }, [teacher]);
  useEffect(() => subscribeTeacherGuideEvents(event => {
    if (!teacher || !guides?.active || guides.active.origin === 'preview') return;
    if (guides.activeStep?.successEvent === event) guides.advance();
  }), [teacher, guides]);
  useEffect(() => {
    if (!teacher || guides?.active?.guide.id !== 'teacher-first-assignment' || guides.active.origin === 'preview') return;
    const { teacherSelectedCount: count, teacherWizardOpen: open, teacherConfirming: confirming, teacherAction: action } = guides.facts;
    if ((count ?? 0) > 1 || action === 'complete') { guides.defer(); return; }
    if (guides.activeStep?.id === 'select' && count === 1 && open) guides.advance();
    if (guides.activeStep?.id === 'choose' && count === 1 && action === 'assign' && confirming) guides.advance();
  }, [teacher, guides]);
  return null;
}
