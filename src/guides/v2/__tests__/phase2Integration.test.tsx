import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuideProviderV2, useGuideV2 } from '../GuideProviderV2';
import { OverlayCoordinatorProvider } from '../OverlayCoordinator';
import { STUDENT_GUIDES } from '../studentContent';
import { setStudentRolloutOverride, setTutorialV2Override, isTutorialV2Enabled } from '../featureFlag';
import { notifyRouteEntry, resetRouteEntriesForTest } from '../routeEntry';
import { createProgressStore } from '../progressStore';
import { setTutorialTelemetrySink } from '../telemetry';

const state = vi.hoisted(() => ({ user: null as any, writes: [] as unknown[] }));
vi.mock('../../../context/StudentUserProvider', () => ({ useUserContext: () => ({ user: state.user }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('axios', () => ({ default: { patch: (...args: unknown[]) => { state.writes.push(args); return Promise.resolve({}); } } }));
const Probe = () => {
  const g = useGuideV2();
  return <><output data-testid="active">{g.active?.guide.id ?? 'none'}</output>
    <output data-testid="mode">{g.context.rewardMode}</output><output data-testid="fault">{String(g.context.dataFault)}</output>
    <output data-testid="target">{g.activeStep?.targetId ?? 'none'}</output>
    <button onClick={g.requestAutoStart}>auto</button><button onClick={g.complete}>complete</button>
    <button onClick={g.advance}>next</button><button onClick={g.defer}>later</button>
    <button onClick={() => g.previewGuide('solo-first-mission')}>preview</button></>;
};
const App = () => <OverlayCoordinatorProvider><GuideProviderV2><Probe /></GuideProviderV2></OverlayCoordinatorProvider>;
const click = (name: string) => fireEvent.click(screen.getByText(name));
const account = (extra = {}) => ({ id: 7, role: 'Student', organizationId: null, classId: null, accountCreatedAt: '2026-09-08T00:00:00Z', seenGuides: [], ...extra });
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); state.writes = []; state.user = account();
  localStorage.setItem('token', 'fixture-token'); resetRouteEntriesForTest();
  notifyRouteEntry('/student/home'); setTutorialV2Override(['solo', 'school-student']);
  setStudentRolloutOverride('2026-09-08T00:00:00Z');
});
afterEach(() => { cleanup(); setTutorialTelemetrySink(null); setTutorialV2Override(null); setStudentRolloutOverride(null); });

describe('Phase 2A eligibility with the complete Phase 2B production registry', () => {
  it.each([
    ['old Solo', null, null, '2026-09-07T23:59:59Z', 'none', 'instant', false],
    ['new Solo', null, null, '2026-09-08T00:00:00Z', 'solo-orientation', 'instant', false],
    ['old School', 1, 2, '2026-09-07T23:59:59Z', 'none', 'approval', false],
    ['new School', 1, 2, '2026-09-08T00:00:00Z', 'school-orientation', 'approval', false],
    ['classless School', 1, null, '2026-09-08T00:00:00Z', 'school-orientation', 'approval', false],
    ['class-only fault', null, 2, '2026-09-08T00:00:00Z', 'school-orientation', 'approval', true],
    ['unknown age', null, null, null, 'none', 'instant', false],
    ['invalid age', null, null, 'invalid', 'none', 'instant', false],
  ])('%s', (_, organizationId, classId, accountCreatedAt, expected, mode, fault) => {
    state.user = account({ organizationId, classId, accountCreatedAt }); render(<App />); click('auto');
    expect(screen.getByTestId('active').textContent).toBe(expected);
    expect(screen.getByTestId('mode').textContent).toBe(mode);
    expect(screen.getByTestId('fault').textContent).toBe(String(fault));
    expect(state.writes).toEqual([]);
  });
  it('has exactly the intended 19 unique guides and no other role content', () => {
    expect(STUDENT_GUIDES.map(g => g.id).sort()).toEqual([
      'solo-orientation', 'school-orientation', 'solo-first-mission', 'school-first-mission',
      'solo-reward-xp', 'solo-domains', 'solo-shop-intro', 'solo-tree-intro', 'solo-tree-grow',
      'solo-challenges', 'solo-medals', 'solo-trophies', 'solo-stats', 'solo-profile-link',
      'school-approval-pending', 'school-approval-lifecycle', 'school-approval-denied', 'school-todo', 'school-leaderboard',
    ].sort());
    for (const role of ['teacher', 'parent', 'school-admin', 'super-admin'] as const) expect(isTutorialV2Enabled(role)).toBe(false);
  });
  it('offers contextual content to old accounts while withholding first success', () => {
    state.user = account({ accountCreatedAt: '2020-01-01T00:00:00Z' });
    notifyRouteEntry('/student/challenges'); render(<App />); click('auto');
    expect(screen.getByTestId('active')).toHaveTextContent('solo-domains');
  });
  it('keeps all age-gated production guides off without a cutoff', () => {
    setStudentRolloutOverride(null); render(<App />); click('auto');
    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });
  it.each([undefined, 'Headmaster', 42, {}])('refuses malformed role %s and every persistence path', role => {
    state.user = account({ role }); render(<App />); click('auto'); click('preview'); click('complete');
    expect(screen.getByTestId('active')).toHaveTextContent('none'); expect(state.writes).toEqual([]);
  });
  it('impersonated preview is visible, target-free, and read-only throughout', () => {
    localStorage.setItem('isImpersonated', 'true'); const telemetry = vi.fn(); setTutorialTelemetrySink(telemetry);
    render(<App />); click('auto'); expect(screen.getByTestId('active')).toHaveTextContent('none');
    click('preview'); expect(screen.getByTestId('active')).toHaveTextContent('solo-first-mission');
    expect(screen.getByTestId('target')).toHaveTextContent('none'); click('next'); click('auto'); click('complete');
    expect(state.writes).toEqual([]); expect(telemetry).not.toHaveBeenCalled();
    expect(localStorage.getItem('guideProgress-u7')).toBeNull();
  });
  it('reports malformed identity once across account orchestration resets without PII', () => {
    const sink = vi.fn(); setTutorialTelemetrySink(sink);
    state.user = account({ role: 'Unknown' }); const app = render(<App />);
    state.user = account({ role: 'Malformed', id: 8 }); app.rerender(<App />);
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith('guide_experience_invalid', { experience: 'unsupported' });
  });
  it('drops an active guide across account changes without writing it to the next account', () => {
    const app = render(<App />); click('auto'); expect(screen.getByTestId('active')).toHaveTextContent('solo-orientation');
    state.user = account({ id: 8, organizationId: 1 }); app.rerender(<App />);
    expect(screen.getByTestId('active')).toHaveTextContent('none'); click('complete');
    expect(state.writes).toEqual([]); expect(localStorage.getItem('seenGuides-u8')).toBeNull();
    click('auto'); expect(screen.getByTestId('active')).toHaveTextContent('school-orientation');
  });
  it('keeps an impersonated read of expired progress free of storage mutations', () => {
    const writer = createProgressStore({ accountKey: 'u7', now: () => 0 });
    writer.save({ guideId: 'solo-first-mission', version: 1, stepId: 'act', stepIndex: 2 }, 4);
    const before = localStorage.getItem('guideProgress-u7');
    const reader = createProgressStore({ accountKey: 'u7', readOnly: true, now: () => 86400000 });
    expect(reader.load()).toBeNull(); reader.clear();
    expect(localStorage.getItem('guideProgress-u7')).toBe(before);
    expect(sessionStorage.getItem('guideProgress-u7')).toBe(before);
  });
});
