import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ParentInvite from './ParentInvite';
import { subscribeParentGuideEvents } from '../../guides/v2/parentSignals';
vi.mock('../../guides/v2/useGuideAutoStart', () => ({ useGuideAutoStart: () => undefined }));
vi.mock('../../components/navbar/ParentNavbar', () => ({default:()=>null}));
vi.mock('../../components/navbar/TeacherNavbar', () => ({default:()=>null}));
vi.mock('../../components/navbar/StudentNavbar', () => ({default:()=>null}));
vi.mock('../../components/GoBackButton', () => ({default:()=>null}));
vi.mock('../student/tutorial/GetAvatar', () => ({default:()=>null}));
vi.mock('../../components/MedalAndLevel', () => ({default:()=>null}));
vi.mock('react-i18next', () => ({useTranslation:()=>({t:(key:string)=>key})}));
beforeEach(()=> {localStorage.setItem('token','fixture');localStorage.setItem('role','Parent');});
afterEach(()=> {cleanup();vi.unstubAllGlobals();localStorage.clear();});
it.each([200,409,500])('link response %i emits success only for a confirmed relationship', async status => {
  let resolveLink!: (value:unknown)=>void;
  const request=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({data:{id:7,xp:0,treeProgress:1,user:{firstName:'Child',lastName:'Fixture'}}})})
    .mockImplementationOnce(()=>new Promise(resolve=>{resolveLink=resolve;}));
  vi.stubGlobal('fetch',request);
  const observed=vi.fn();const stop=subscribeParentGuideEvents(observed);
  try {
    render(<MemoryRouter><ParentInvite /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox'),{target:{value:'123456'}});
    fireEvent.click(screen.getByRole('button',{name:'بحث'}));
    const confirm=await screen.findByRole('button',{name:'دعوة'});
    expect(observed).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    expect(observed).not.toHaveBeenCalled();
    expect(request.mock.calls[1][1]).toMatchObject({method:'PATCH',body:JSON.stringify({code:'123456'})});
    resolveLink({ok:status===200,status});
    // 409 means the child is linked to another parent; it gets its own message.
    const expected=status===200?'لقد تمت دعوة الطالب بنجاح':status===409?'الطالب مرتبط بالفعل بولي أمر آخر':'فشلت عملية الدعوة';
    await waitFor(()=>expect(screen.getByText(expected)).toBeTruthy());
    expect(observed.mock.calls).toEqual(status===200?[['child-linked']]:[]);
  } finally {stop();}
});
