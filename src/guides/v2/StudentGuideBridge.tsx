import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../../context/StudentUserProvider';
import { registerHelpTopicOpener } from './helpFallback';
import { publishGuideFacts } from './facts';

/** Router integration only; identity/rollout eligibility stays in the V2 provider. */
export default function StudentGuideBridge() {
  const history = useHistory();
  const { user } = useUserContext();
  useEffect(() => {
    publishGuideFacts({ pendingApprovalCount: 0, approvedApprovalCount: 0, deniedApprovalCount: 0, assignedMissionCount: 0 });
  }, [user?.id]);
  useEffect(() => {
    publishGuideFacts({ studentClassAvailable: user?.role === 'Student' && user?.organizationId != null && user?.classId != null });
  }, [user?.id, user?.role, user?.organizationId, user?.classId]);
  useEffect(() => {
    if (user?.role !== 'Student') return;
    registerHelpTopicOpener(topic => {
      history.push(`/help?topic=${encodeURIComponent(topic)}&fallback=1`);
      return true;
    });
    return () => registerHelpTopicOpener(null);
  }, [history, user?.role]);
  return null;
}
