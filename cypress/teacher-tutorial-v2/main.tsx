import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../../src/i18n';
import '../../src/index.css';
import { TEACHER_GUIDES } from '../../src/guides/v2/teacherContent';
import { GuideProviderV2, useGuideV2 } from '../../src/guides/v2/GuideProviderV2';
import GuideOverlayV2 from '../../src/guides/v2/GuideOverlayV2';
import { OverlayCoordinatorProvider } from '../../src/guides/v2/OverlayCoordinator';
import { setTutorialV2Override } from '../../src/guides/v2/featureFlag';
import { setTutorialTelemetrySink } from '../../src/guides/v2/telemetry';

// Same authored steps and production renderer. Only navigation targets and
// profile data are fixtures; this page cannot assign, complete, approve or deny.
const registry = TEACHER_GUIDES.map(entry => ({ ...entry, route: location.pathname, view: undefined, prerequisites: [], replayTarget: { route: location.pathname } }));
setTutorialV2Override(['teacher']);
const events: unknown[] = [];
setTutorialTelemetrySink(event => { events.push(event); });
await i18n.changeLanguage(new URLSearchParams(location.search).get('locale') ?? 'ar');
const Fixture = () => {
  const guides = useGuideV2();
  useEffect(() => {
    Object.assign(window, { tutorialFixture: {
      guides: registry.map(entry => ({ id: entry.id, steps: entry.steps.length })),
      show: (id: string) => guides.previewGuide(id), next: guides.advance,
      events, active: guides.active,
    } });
  }, [guides]);
  return <main className="min-h-screen bg-slate-100 p-5"><h1 className="text-xl">Teacher tutorial layout fixture</h1>
    <div className="mt-8 rounded-xl bg-white p-4 shadow" style={{ height: 80 }}>
      {Array.from(new Set(registry.flatMap(entry => entry.steps.flatMap(step => step.targetId ? [step.targetId] : [])))).map(id => <button key={id} data-guide-id={id} tabIndex={-1} style={{ position: 'absolute', top: 85, left: 20, width: 'calc(100% - 40px)', height: 64 }}>Live control placement fixture</button>)}
    </div><GuideOverlayV2 /></main>;
};
createRoot(document.getElementById('root')!).render(<OverlayCoordinatorProvider><GuideProviderV2 registry={registry}><Fixture /></GuideProviderV2></OverlayCoordinatorProvider>);
