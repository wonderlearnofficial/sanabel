import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useOptionalGuideV2 } from './GuideProviderV2';
import { registerHelpTopicOpener } from './helpFallback';
import { publishGuideFacts } from './facts';
import { subscribeParentGuideEvents } from './parentSignals';

export default function ParentGuideBridge() {
  const guides = useOptionalGuideV2();
  const history = useHistory();
  const parent = guides?.enabled && guides.context.experience === 'parent';
  useEffect(() => {
    if (!parent) return;
    registerHelpTopicOpener(topic => { history.push(`/parent/help?topic=${encodeURIComponent(topic)}&fallback=1`); return true; });
    return () => registerHelpTopicOpener(null);
  }, [parent, history]);
  useEffect(() => () => { if (parent) publishGuideFacts({ linkedChildCount: undefined, parentChildrenKnown: false }); }, [parent, guides?.context.accountKey]);
  useEffect(() => subscribeParentGuideEvents(event => {
    if (!parent || !guides?.active || guides.active.origin === 'preview') return;
    if (guides.activeStep?.successEvent === event) guides.advance();
  }), [parent, guides]);
  return null;
}
