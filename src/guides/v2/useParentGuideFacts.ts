import { useEffect } from 'react';
import { publishGuideFacts } from './facts';
import { useOptionalGuideV2 } from './GuideProviderV2';
import { useGuideAutoStart } from './useGuideAutoStart';

export const useParentGuideFacts = (childCount: number | null, pending?: number) => {
  const guides = useOptionalGuideV2();
  const parent = guides?.enabled && guides.context.experience === 'parent';
  useEffect(() => {
    if (!parent) return;
    publishGuideFacts({ parentChildrenKnown: childCount !== null, linkedChildCount: childCount ?? undefined,
      ...(pending === undefined ? {} : { pendingApprovalCount: pending }) });
  }, [parent, childCount, pending]);
  useGuideAutoStart(Boolean(parent && childCount !== null));
};
