import { useEffect } from 'react';
import { publishGuideFacts } from './facts';
import { PredicateFacts } from './predicates';
import { useGuideAutoStart } from './useGuideAutoStart';

/** Call only with data already loaded by an existing authorized page request. */
export const useTeacherGuideFacts = (teacher: boolean, facts: PredicateFacts) => {
  const serialized = JSON.stringify(facts);
  useEffect(() => { if (teacher) publishGuideFacts(JSON.parse(serialized)); }, [teacher, serialized]);
  useGuideAutoStart(teacher);
};
