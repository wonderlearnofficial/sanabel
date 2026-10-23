import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PARENT_GUIDES, parentTranslations } from '../parentContent';
import { GuideProviderV2, useGuideV2 } from '../GuideProviderV2';
import { OverlayCoordinatorProvider } from '../OverlayCoordinator';
import GuideOverlayV2 from '../GuideOverlayV2';
import ParentGuideBridge from '../ParentGuideBridge';
import ParentHelpV2, { parentReplayGuides } from '../../../pages/teacherorparent/ParentHelpV2';
import { setTutorialV2Override, isTutorialV2Enabled } from '../featureFlag';
import { publishGuideFacts, resetGuideFactsForTest } from '../facts';
import { notifyRouteEntry, resetRouteEntriesForTest } from '../routeEntry';
import { emitParentGuideEvent } from '../parentSignals';
import { parentResumeIndex } from '../parentRuntime';
import { resolveExperience } from '../resolveExperience';
import { validateRegistry } from '../registry';
import { registerHelpTopicOpener } from '../helpFallback';
import { createProgressStore } from '../progressStore';
import en from '../../../languages/en';
import ar from '../../../languages/ar';

const state = vi.hoisted(() => ({ user: {} as any }));
vi.mock('../../../context/StudentUserProvider', () => ({ useUserContext: () => ({ user: state.user }) }));
vi.mock('../../../components/GoBackButton', () => ({ default: () => <button>Back</button> }));
vi.mock('axios', () => ({ default: { patch: vi.fn().mockResolvedValue({ data: {} }) } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => (en.translation as Record<string,string>)[key] ?? key, i18n: { language: 'en' } }) }));
const entry = (id: string) => PARENT_GUIDES.find(g => g.id === id)!;
const context = () => resolveExperience({ role: 'Parent', userId: 77, locale: 'en' });
const Probe = () => {
  const g = useGuideV2();
  return <><button onClick={g.requestAutoStart}>auto</button><button onClick={() => g.replayGuide(g.registry[0].id)}>replay</button><button onClick={g.advance}>advance</button>
    <output data-testid="active">{g.active?.guide.id ?? 'none'}</output><output data-testid="step">{g.active?.stepIndex ?? -1}</output><output data-testid="seen">{String(g.isSeen(g.registry[0].id))}</output>
    <div data-guide-id="parent-link-form"><input aria-label="code" /></div><button data-guide-id="parent-link-confirm">link</button>
    <div data-guide-id="parent-child-list"><button>child</button></div><div data-guide-id="parent-progress-overview">progress</div><button data-guide-id="parent-support">support</button>
    <div data-guide-id="parent-approval-request"><button>approve</button><button>deny</button></div><button data-guide-id="parent-invite-cta">invite</button><button data-guide-id="parent-progress-cta">view</button></>;
};
function mount(id: string, childCount = 0, pending = 0) {
  const guide = entry(id);
  window.history.replaceState({}, '', guide.route); notifyRouteEntry(guide.route);
  publishGuideFacts({ parentChildrenKnown: true, linkedChildCount: childCount, pendingApprovalCount: pending });
  return render(<MemoryRouter><OverlayCoordinatorProvider><GuideProviderV2 registry={[guide]}><ParentGuideBridge /><Probe /><GuideOverlayV2 /></GuideProviderV2></OverlayCoordinatorProvider></MemoryRouter>);
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); resetGuideFactsForTest(); resetRouteEntriesForTest();
  state.user = { id: 77, role: 'Parent', accountCreatedAt: '2026-09-09T00:00:00Z', seenGuides: [] };
  setTutorialV2Override(['parent']);
  // Existing engine development override, never a separate Parent age comparison.
  localStorage.setItem('sanabel:tutorialV2TreatAccountAsNew', 'true');
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as any);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x:20,y:60,left:20,top:60,width:250,height:44,right:270,bottom:104,toJSON:()=>({}) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); registerHelpTopicOpener(null); });
describe('Parent role content and branching', () => {
  it('validates Parent-only content and complete real language catalogues', () => {
    expect(validateRegistry(PARENT_GUIDES)).toEqual([]);
    for (const g of PARENT_GUIDES) {
      expect(g.experiences).toEqual(['parent']);
      for (const s of g.steps) for (const key of [s.titleKey, s.descriptionKey!]) {
        expect((en.translation as Record<string,string>)[key]).toBe(parentTranslations('en')[key]);
        expect(parentTranslations('en')[key]).toBeTruthy();
        expect((ar.translation as Record<string,string>)[key]).toBe(parentTranslations('ar')[key]);
      }
    }
    const text = Object.values(parentTranslations('en')).join(' ');
    expect(text).not.toMatch(/[\u0600-\u06ff]|assign|class roster|admin|\+\d/i);
  });
  it.each([0,1,3])('branches Help/replay for %i children', count => {
    const ids = parentReplayGuides(context(), { parentChildrenKnown:true, linkedChildCount:count }).map(g=>g.id);
    expect(ids.includes('parent-first-link')).toBe(count === 0);
    expect(ids.includes('parent-first-progress')).toBe(count > 0);
    expect(ids.includes('parent-child-switch')).toBe(count > 1);
    expect(ids).not.toContain('parent-approval-pending');
  });
  it('fails closed while child data is unknown and rejects other roles', () => {
    expect(parentReplayGuides(context(), {})).toEqual([]);
    expect(parentReplayGuides({...context(),experience:'teacher'}, {parentChildrenKnown:true,linkedChildCount:3,pendingApprovalCount:2})).toEqual([]);
  });
  it.each([0,1,3])('orients a new Parent with %i children in at most two steps', count => {
    const id = count === 0 ? 'parent-orientation-empty' : 'parent-orientation-linked';
    mount(id,count); fireEvent.click(screen.getByText('auto'));
    expect(screen.getByTestId('active').textContent).toBe(id);
    expect(entry(id).steps.length).toBeLessThanOrEqual(2);
    fireEvent.keyDown(document, {key:'Escape'});
    expect(screen.getByTestId('seen').textContent).toBe('true');
  });
  it('withholds orientation for existing/unknown account age', () => {
    localStorage.removeItem('sanabel:tutorialV2TreatAccountAsNew'); state.user.accountCreatedAt = null;
    mount('parent-orientation-empty'); fireEvent.click(screen.getByText('auto'));
    expect(screen.getByTestId('active').textContent).toBe('none');
  });
  it('enables only Parent and preserves flag-off behavior', () => {
    expect(isTutorialV2Enabled('teacher')).toBe(false); expect(isTutorialV2Enabled('school-admin')).toBe(false);
    setTutorialV2Override('off'); mount('parent-orientation-empty'); fireEvent.click(screen.getByText('auto'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
describe('real action observation, persistence and replay', () => {
  it('a link click or failed request cannot finish; real success advances', async () => {
    mount('parent-first-link'); fireEvent.click(screen.getByText('auto'));
    expect(screen.getByTestId('step').textContent).toBe('1');
    expect(document.activeElement).toBe(screen.getByText('link'));
    fireEvent.click(screen.getByText('link'));
    expect(screen.getByTestId('step').textContent).toBe('1');
    act(() => emitParentGuideEvent('child-linked'));
    expect(screen.getByTestId('step').textContent).toBe('2');
    fireEvent.click(screen.getByText('Understood'));
    expect(screen.getByTestId('seen').textContent).toBe('true');
  });
  it('progress waits for loaded details, then explains progress and support', () => {
    mount('parent-first-progress',1); fireEvent.click(screen.getByText('auto')); fireEvent.click(screen.getByText('child'));
    expect(screen.getByTestId('step').textContent).toBe('0');
    act(() => emitParentGuideEvent('parent-progress-opened'));
    expect(screen.getByTestId('step').textContent).toBe('1');
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('dialog').textContent).toContain('Support and approvals');
  });
  it.each(['approve','deny'])('only a successful %s decision completes the action guide', decision => {
    mount('parent-approval-pending',1,1); fireEvent.click(screen.getByText('auto')); fireEvent.click(screen.getByText(decision));
    expect(screen.getByTestId('seen').textContent).toBe('false');
    act(() => emitParentGuideEvent('parent-approval-decided'));
    expect(screen.getByTestId('seen').textContent).toBe('true');
    expect(localStorage.getItem('guideProgress-77')).toBeNull();
  });
  it('Later leaves first-success unseen and records resumable position', () => {
    mount('parent-first-progress',1); fireEvent.click(screen.getByText('auto')); fireEvent.keyDown(document,{key:'Escape'});
    expect(screen.getByTestId('seen').textContent).toBe('false');
    expect(createProgressStore({accountKey:context().accountKey}).load()?.guideId).toBe('parent-first-progress');
    expect(parentResumeIndex('parent-first-progress',2)).toBe(0);
    expect(parentResumeIndex('parent-first-link',1)).toBe(0);
  });
  it.each(['parent-first-link','parent-first-progress'])('%s resumes within 24 hours and expires at the boundary', id => {
    let time=1000;
    const progress=createProgressStore({accountKey:context().accountKey,now:()=>time});
    progress.save({guideId:id,version:1,stepId:'confirm',stepIndex:1},3);
    time+=24*60*60*1000-1;
    expect(progress.load()?.guideId).toBe(id);
    time+=1;
    expect(progress.load()).toBeNull();
  });
  it('replay waits for the target and never marks seen', async () => {
    mount('parent-approval-pending',1,1);
    await act(async () => { fireEvent.click(screen.getByText('replay')); });
    expect(screen.getByTestId('active').textContent).toBe('parent-approval-pending');
    act(() => emitParentGuideEvent('parent-approval-decided'));
    expect(screen.getByTestId('seen').textContent).toBe('false');
  });
  it('unavailable approval replay opens Help instead of an invisible guide', () => {
    mount('parent-approval-pending',1,0); const help=vi.fn(()=>true); registerHelpTopicOpener(help);
    fireEvent.click(screen.getByText('replay'));
    expect(help).toHaveBeenCalledWith('parent-approval-pending');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('zero-child Help offers linking and informative topics without dead progress replay', () => {
    publishGuideFacts({parentChildrenKnown:true,linkedChildCount:0});
    render(<MemoryRouter><OverlayCoordinatorProvider><GuideProviderV2><ParentHelpV2 /></GuideProviderV2></OverlayCoordinatorProvider></MemoryRouter>);
    expect(screen.getByText('Parent Help')).toBeTruthy();
    expect(screen.getAllByText('Show me how')).toHaveLength(1);
    expect(screen.queryByText('Teacher Help')).toBeNull();
  });
});
