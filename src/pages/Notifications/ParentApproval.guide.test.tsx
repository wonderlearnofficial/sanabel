import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { subscribeParentGuideEvents } from '../../guides/v2/parentSignals';
const api=vi.hoisted(()=>({post:vi.fn(),get:vi.fn()}));
vi.mock('axios',()=>({default:api}));
const Probe=()=>{const n=useNotifications();return <><button onClick={()=>void n.approveApprovalRequest(9).catch(()=>undefined)}>approve</button><button onClick={()=>void n.denyApprovalRequest(9).catch(()=>undefined)}>deny</button></>;};
beforeEach(()=>{localStorage.clear();localStorage.setItem('role','Parent');localStorage.setItem('token','fixture');api.get.mockResolvedValue({status:200,data:{data:[]}});api.post.mockReset();});
afterEach(()=>{cleanup();vi.clearAllMocks();localStorage.clear();});
it.each([['approve',true],['deny',true],['approve',false],['deny',false]] as const)('%s success=%s observes the server response',async(decision,success)=>{
  let resolve!:()=>void;
  api.post.mockImplementation(()=>new Promise((yes,no)=>{resolve=()=>success?yes({status:200}):no(new Error('conflict'));}));
  const events=vi.fn();const stop=subscribeParentGuideEvents(events);
  try {
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await waitFor(()=>expect(api.get).toHaveBeenCalled());api.get.mockClear();
    fireEvent.click(screen.getByText(decision));
    expect(events).not.toHaveBeenCalled();
    expect(api.post.mock.calls[0][0]).toMatch(new RegExp(`/parents/${decision}Request$`));
    resolve();
    await waitFor(()=>expect(api.get).toHaveBeenCalled());
    expect(events.mock.calls).toEqual(success?[['parent-approval-decided']]:[]);
  }finally{stop();}
});
it('Teacher decisions do not emit Parent success',async()=>{
  localStorage.setItem('role','Teacher');api.post.mockResolvedValue({status:200});
  const events=vi.fn();const stop=subscribeParentGuideEvents(events);
  try{render(<NotificationProvider><Probe /></NotificationProvider>);fireEvent.click(screen.getByText('approve'));await waitFor(()=>expect(api.post).toHaveBeenCalled());expect(events).not.toHaveBeenCalled();}finally{stop();}
});
