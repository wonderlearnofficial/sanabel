import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { chromeTranslations } from '../chromeCopy';
import { STUDENT_GUIDES, studentCopy, studentTranslations, studentVisuals } from '../studentContent';
import { GuideProviderV2, useGuideV2 } from '../GuideProviderV2';
import GuideOverlayV2 from '../GuideOverlayV2';
import { OverlayCoordinatorProvider, useOverlayClaim } from '../OverlayCoordinator';
import { setTutorialV2Override, setStudentRolloutOverride } from '../featureFlag';
import { notifyRouteEntry, resetRouteEntriesForTest } from '../routeEntry';
import { resetGuideFactsForTest } from '../facts';
import { emitStudentGuideSignal, isNoApproverError } from '../studentSignals';
import { useStudentGuideToast } from '../useStudentGuideFeedback';
import { studentGuideAllowed, waitForStudentReplay } from '../studentReplay';
import { registerHelpTopicOpener } from '../helpFallback';
import { createProgressStore } from '../progressStore';
import { setTutorialTelemetrySink } from '../telemetry';
import { useGuideViewSelector } from '../GuideViewController';
import { enterGuideView, leaveGuideView } from '../viewRegistry';
import arCatalogue from '../../../languages/ar';
import enCatalogue from '../../../languages/en';
import StudentHelpV2, { studentHelpGuides, studentReplayGuides } from '../../../pages/student/StudentHelpV2';
import { ExperienceContext, GuideRegistryEntry } from '../types';

const state = vi.hoisted(() => ({ user: null as any, locale: 'ar', patches: [] as any[], messages: [] as any[] }));
vi.mock('../../../components/GoBackButton', () => ({ default: () => <button>Back</button> }));
vi.mock('../../GuideReplayList', () => ({ default: () => <div>Legacy replay</div> }));
vi.mock('../../../context/StudentUserProvider', () => ({ useUserContext: () => ({ user: state.user }) }));
vi.mock('axios', () => ({ default: { patch: (...args: any[]) => { state.patches.push(args); return Promise.resolve({ data: {} }); } } }));
vi.mock('react-toastify', () => ({ toast: Object.fromEntries(['success', 'info', 'warning', 'error'].map(kind => [kind, (text: string) => state.messages.push({ kind, text })])) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, values?: Record<string, any>) => {
  // Engine chrome (Step/Next/Understood/…) lives in the neutral
  // `guide.common.*` namespace; role copy stays under `tutorial.student.*`.
  const catalogue = { ...chromeTranslations(state.locale as 'ar' | 'en'), ...studentTranslations(state.locale as 'ar' | 'en') };
  let text = catalogue[key] ?? key;
  Object.entries(values ?? {}).forEach(([key, value]) => { text = text.replace(`{{${key}}}`, String(value)); });
  return text;
}, i18n: { language: state.locale } }) }));

const context = (school = false): ExperienceContext => ({ experience: school ? 'school-student' : 'solo', rewardMode: school ? 'approval' : 'instant', scope: school ? 'organization' : 'solo', dataFault: false, isImpersonating: false, isPreview: false, childCount: 0, locale: 'en', accountKey: '7', accountCreatedAt: null });
const guide = (id: string) => STUDENT_GUIDES.find(item => item.id === id)!;
const Probe = () => {
  const g = useGuideV2();
  return <><button onClick={g.requestAutoStart}>auto</button><button onClick={() => g.replayGuide(g.registry[0].id)}>replay</button><button onClick={() => g.previewGuide(g.registry[0].id)}>preview</button>
    <output data-testid="active">{g.active?.guide.id ?? 'none'}</output><output data-testid="step">{g.active?.stepIndex ?? -1}</output><output data-testid="seen">{String(g.isSeen(g.registry[0].id))}</output>
    <button data-guide-id="daily-challenges">missions</button><div data-guide-id="student-mission-workspace">workspace</div><button data-guide-id="mission-action">complete mission</button><button data-guide-id="tree-grow">grow</button></>;
};
const mount = (entry: GuideRegistryEntry, children?: React.ReactNode) => render(<OverlayCoordinatorProvider><GuideProviderV2 registry={[entry]}><Probe />{children}<GuideOverlayV2 /></GuideProviderV2></OverlayCoordinatorProvider>);
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); resetRouteEntriesForTest(); resetGuideFactsForTest();
  state.user = { id: 7, role: 'Student', organizationId: null, classId: null, accountCreatedAt: '2026-09-09T00:00:00Z', seenGuides: [], xp: 23 };
  state.locale = 'en'; state.messages = []; state.patches = [];
  setTutorialV2Override('on'); setStudentRolloutOverride('2026-09-08T00:00:00Z');
  window.history.replaceState({}, '', '/student/home'); notifyRouteEntry('/student/home');
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 20, y: 60, left: 20, top: 60, width: 200, height: 44, right: 220, bottom: 104, toJSON: () => ({}) });
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as any);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); setTutorialTelemetrySink(null); registerHelpTopicOpener(null); setTutorialV2Override(null); setStudentRolloutOverride(null); });

describe('Student content boundaries', () => {
  it('loads the real catalogues with Arabic after the English mirror', () => {
    for (const [key, [ar, en]] of Object.entries(studentCopy)) {
      expect((arCatalogue.translation as Record<string, string>)[`tutorial.student.${key}`]).toBe(ar);
      expect((enCatalogue.translation as Record<string, string>)[`tutorial.student.${key}`]).toBe(en);
    }
  });
  it('has all four separate domain assets and exactly three wallets', () => {
    expect(studentVisuals.domains.map(item => item.label)).toEqual(['allah', 'self', 'family', 'earth']);
    expect(studentVisuals.balances.map(item => item.label)).toEqual(['blue', 'red', 'yellow']);
    expect(new Set(studentVisuals.domains.map(item => item.src)).size).toBe(4);
    expect(studentVisuals.balances.every(item => !studentVisuals.domains.some(domain => domain.src === item.src))).toBe(true);
  });
  it('gives every authored key complete Arabic and English coverage without invented constants', () => {
    for (const [ar, en] of Object.values(studentCopy)) {
      expect(ar.trim()).not.toBe(''); expect(en.trim()).not.toBe('');
      expect(en).not.toMatch(/[\u0600-\u06ff]/);
      expect(ar + en).not.toMatch(/\b(?:48|51)\b|\+5|\+2|seeders/);
    }
    STUDENT_GUIDES.flatMap(item => item.steps).forEach(step => {
      expect(studentTranslations('en')[step.titleKey]).toBeTruthy();
      expect(studentTranslations('ar')[step.descriptionKey!]).toBeTruthy();
    });
  });
  it('does not leak approval or class competition into Solo copy', () => {
    const copy = studentHelpGuides(context(), {}).flatMap(item => item.steps).flatMap(step => [studentTranslations('en')[step.titleKey], studentTranslations('en')[step.descriptionKey!]]).join(' ');
    expect(copy).not.toMatch(/approval|teacher|parent confirmation|leaderboard/i);
  });
  it('does not promise instant self rewards to School Students', () => {
    const copy = studentHelpGuides(context(true), {}).flatMap(item => item.steps).map(step => studentTranslations('en')[step.descriptionKey!]).join(' ');
    expect(copy).not.toMatch(/straight away|instantly|immediately/);
  });
  it.each([[false, false, false], [true, true, true], [true, false, false]])('gates leaderboard: school %s class %s', (school, hasClass, expected) => {
    expect(studentGuideAllowed(guide('school-leaderboard'), context(school), { studentClassAvailable: hasClass })).toBe(expected);
  });
  it('keeps orientation short and first-success new-users-only', () => {
    for (const entry of STUDENT_GUIDES.filter(item => ['orientation', 'first-success'].includes(item.priority))) {
      expect(entry.bumpPolicy).toBe('new-users-only');
      if (entry.priority === 'orientation') expect(entry.steps.length).toBeLessThanOrEqual(2);
    }
  });
});

describe('real actions, never synthetic gameplay', () => {
  it.each([false, true])('waits for a real successful mission response (school %s)', school => {
    if (school) state.user.organizationId = 1;
    mount(guide(school ? 'school-first-mission' : 'solo-first-mission'));
    fireEvent.click(screen.getByText('auto'));
    fireEvent.click(screen.getByText('missions'));
    fireEvent.click(screen.getByText('complete mission'));
    expect(screen.getByTestId('step')).toHaveTextContent('2');
    expect(state.patches).toEqual([]);
    act(() => emitStudentGuideSignal({ type: school ? 'approval-sent' : 'mission-completed' }));
    expect(screen.getByTestId('step')).toHaveTextContent('3');
    expect(screen.getByText(school ? 'Pending' : 'Your completion is recorded')).toBeTruthy();
    fireEvent.click(screen.getByText('Understood'));
    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });
  it('classless no-approver parks unseen and remains retryable', () => {
    state.user.organizationId = 1;
    mount(guide('school-first-mission'));
    fireEvent.click(screen.getByText('auto')); fireEvent.click(screen.getByText('missions'));
    expect(isNoApproverError({ response: { data: { message: 'No parent or teacher is available to approve your mission.' } } })).toBe(true);
    act(() => emitStudentGuideSignal({ type: 'no-approver' }));
    expect(screen.getByTestId('active')).toHaveTextContent('none');
    expect(state.patches).toEqual([]);
    expect(screen.queryByText('Pending')).toBeNull();
    expect(screen.getByTestId('seen')).toHaveTextContent('false');
    expect(createProgressStore({ accountKey: 'u7' }).load()?.stepIndex).toBe(2);
  });
  it('a failed grow tap and Escape never mark Tree growth complete', () => {
    const grow = guide('solo-tree-grow');
    mount({ ...grow, route: '/student/home', view: undefined, autoTrigger: { kind: 'route-enter' }, prerequisites: [] });
    fireEvent.click(screen.getByText('auto')); fireEvent.click(screen.getByText('grow'));
    expect(screen.getByTestId('active')).toHaveTextContent('solo-tree-grow');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(state.patches).toEqual([]);
  });
  it('finishes Tree guide only on committed growth', () => {
    mount({ ...guide('solo-tree-grow'), route: '/student/home', view: undefined, autoTrigger: { kind: 'route-enter' }, prerequisites: [] });
    fireEvent.click(screen.getByText('auto'));
    act(() => emitStudentGuideSignal({ type: 'tree-grown' }));
    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });
});

const ToastProbe = ({ active }: { active: boolean }) => {
  useOverlayClaim(active, 3, 'test guide');
  const show = useStudentGuideToast();
  return <>{(['success', 'info', 'warning', 'error'] as const).map(kind => <button key={kind} onClick={() => show(kind, kind)}>{kind}</button>)}</>;
};
describe('Student toast coordination', () => {
  it('flushes only the latest held message', () => {
    const app = render(<OverlayCoordinatorProvider><ToastProbe active /></OverlayCoordinatorProvider>);
    fireEvent.click(screen.getByText('success')); fireEvent.click(screen.getByText('info')); fireEvent.click(screen.getByText('warning'));
    app.rerender(<OverlayCoordinatorProvider><ToastProbe active={false} /></OverlayCoordinatorProvider>);
    expect(state.messages).toEqual([{ kind: 'warning', text: 'warning' }]);
  });
  it('drops queued and late asynchronous feedback after unmount', () => {
    let feedback: ReturnType<typeof useStudentGuideToast>;
    const AsyncProbe = () => { feedback = useStudentGuideToast(); return null; };
    const app = render(<OverlayCoordinatorProvider><ToastProbe active /><AsyncProbe /></OverlayCoordinatorProvider>);
    act(() => feedback('success', 'held')); app.unmount();
    act(() => feedback('error', 'late error'));
    expect(state.messages).toEqual([]);
  });
  it('delivers normal no-guide toast', () => {
    render(<OverlayCoordinatorProvider><ToastProbe active={false} /></OverlayCoordinatorProvider>);
    fireEvent.click(screen.getByText('success')); expect(state.messages).toEqual([{ kind: 'success', text: 'success' }]);
  });
  it.each(['success', 'info', 'warning'])('defers %s and flushes when guide ends', kind => {
    const app = render(<OverlayCoordinatorProvider><ToastProbe active /></OverlayCoordinatorProvider>);
    fireEvent.click(screen.getByText(kind)); expect(state.messages).toEqual([]);
    app.rerender(<OverlayCoordinatorProvider><ToastProbe active={false} /></OverlayCoordinatorProvider>);
    expect(state.messages).toEqual([{ kind, text: kind }]);
  });
  it('shows critical errors immediately under a guide', () => {
    render(<OverlayCoordinatorProvider><ToastProbe active /></OverlayCoordinatorProvider>);
    fireEvent.click(screen.getByText('error')); expect(state.messages).toEqual([{ kind: 'error', text: 'error' }]);
  });
});

describe('Help and replay', () => {
  it.each(['stats', 'trophies', 'level', 'tree', 'shop'])('selects and mounts the %s view before accepting its target', async view => {
    vi.useFakeTimers();
    const viewId = `student.progress.${view}`;
    const select = vi.fn(() => enterGuideView(viewId));
    const Selector = () => { useGuideViewSelector({ [viewId]: select }); return <button data-guide-id="view-target">target</button>; };
    render(<Selector />);
    const entry = { ...guide('solo-stats'), replayTarget: { route: '/student/progress', view: viewId }, steps: [{ id: 'view', titleKey: 'x', targetId: 'view-target' }] };
    const ready = waitForStudentReplay(entry, () => false);
    expect(select).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/student/progress');
    await vi.advanceTimersByTimeAsync(400);
    expect(await ready).toBe(true); expect(select).toHaveBeenCalledTimes(1);
    leaveGuideView(viewId);
  });
  it.each([false, true])('emits a single target-missing event, suppressed for impersonation %s', async impersonating => {
    vi.useFakeTimers();
    if (impersonating) localStorage.setItem('isImpersonated', 'true');
    const sink = vi.fn(); setTutorialTelemetrySink(sink);
    mount({ ...guide('solo-first-mission'), replayTarget: { route: '/student/home' } });
    fireEvent.click(screen.getByText('replay'));
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    fireEvent.click(screen.getByText('missions'));
    // Selection finds the fixture's actionable mission, then it disappears.
    screen.getByText('complete mission').removeAttribute('data-guide-id');
    await act(async () => { await vi.advanceTimersByTimeAsync(8200); });
    expect(screen.getByTestId('active')).toHaveTextContent('none');
    expect(sink.mock.calls.filter(([name]) => name === 'guide_target_missing')).toHaveLength(impersonating ? 0 : 1);
    if (impersonating) expect(sink).not.toHaveBeenCalled();
    expect(state.patches).toEqual([]);
  });
  it('filters School topics, classless replay, and decisions without real evidence', () => {
    const ids = studentHelpGuides(context(true), {}).map(item => item.id);
    expect(ids).toContain('school-todo'); expect(ids).toContain('school-approval-lifecycle'); expect(ids).not.toContain('school-leaderboard');
    expect(studentReplayGuides(context(true), {}).map(item => item.id)).not.toContain('school-approval-denied');
    expect(studentReplayGuides(context(true), { deniedApprovalCount: 1 }).map(item => item.id)).toContain('school-approval-denied');
  });
  it('renders Solo Help articles and replay rows from registered guides', () => {
    mount(guide('solo-orientation'), <MemoryRouter initialEntries={['/help?topic=solo-domains']}><StudentHelpV2 /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Help & Guide' })).toBeTruthy();
    expect(screen.getByText('Earth & Universe')).toBeTruthy();
    expect(screen.queryByText('Pending')).toBeNull();
  });
  it('missing replay target opens Help after bounded wait', async () => {
    vi.useFakeTimers();
    const help = vi.fn(() => true); registerHelpTopicOpener(help);
    mount({ ...guide('solo-domains'), route: '/student/home', replayTarget: { route: '/student/home' }, steps: [{ id: 'missing', titleKey: 'x', targetId: 'unreachable' }] });
    fireEvent.click(screen.getByText('replay'));
    await act(async () => { await vi.advanceTimersByTimeAsync(8200); });
    expect(help).toHaveBeenCalledWith('solo-domains'); expect(screen.getByTestId('active')).toHaveTextContent('none');
  });
  it('waits for a target to mount rather than refusing a lazy route', async () => {
    vi.useFakeTimers();
    const entry = { ...guide('solo-domains'), replayTarget: { route: '/student/home' }, steps: [{ id: 'late', titleKey: 'x', targetId: 'late-target' }] };
    const ready = waitForStudentReplay(entry, () => false);
    const element = document.createElement('button'); element.dataset.guideId = 'late-target'; document.body.append(element);
    await vi.advanceTimersByTimeAsync(200); expect(await ready).toBe(true); element.remove();
  });
});

describe('real content accessibility', () => {
  it.each(['ar', 'en'])('focus, Escape and direction for %s content', locale => {
    state.locale = locale; mount(guide('solo-orientation')); fireEvent.click(screen.getByText('auto'));
    const dialog = screen.getByRole('dialog'); expect(dialog).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr'); expect(dialog).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.getByTestId('active')).toHaveTextContent('none');
  });
  it('expires first-success progress at 24 hours even in the same tab', () => {
    let now = 0; const store = createProgressStore({ accountKey: '7', now: () => now });
    store.save({ guideId: 'solo-first-mission', version: 1, stepId: 'act', stepIndex: 2 }, 4);
    now = 24 * 60 * 60 * 1000 - 1; expect(store.load()?.stepIndex).toBe(2);
    now++; expect(store.load()).toBeNull();
  });
});
