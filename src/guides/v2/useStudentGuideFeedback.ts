import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useOptionalOverlaySuppressed } from './OverlayCoordinator';
import { emitStudentGuideSignal } from './studentSignals';

/** Keep only the most recent optional message; drop it if its screen unmounts. */
export const useStudentGuideToast = () => {
  const suppressed = useOptionalOverlaySuppressed();
  const held = useRef<{ kind: 'success' | 'info' | 'warning'; text: string } | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; held.current = null; };
  }, []);
  const blocked = useRef(suppressed);
  blocked.current = suppressed;
  useEffect(() => {
    if (!suppressed && held.current) {
      const message = held.current;
      held.current = null;
      toast[message.kind](message.text);
    }
  }, [suppressed]);
  return useCallback((kind: 'success' | 'info' | 'warning' | 'error', text: string) => {
    if (!mounted.current) return;
    if (kind === 'error') { toast.error(text); return; }
    if (blocked.current) held.current = { kind, text };
    else toast[kind](text);
  }, []);
};

/** The real confirmation dialog gets the screen while the guide waits for success. */
export const useStudentGameplayDialog = (open: boolean) => {
  useEffect(() => {
    emitStudentGuideSignal({ type: 'dialog', open });
    return () => { if (open) emitStudentGuideSignal({ type: 'dialog', open: false }); };
  }, [open]);
};
