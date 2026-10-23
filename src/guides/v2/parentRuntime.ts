import { GuideRegistryEntry } from './types';

/** Rebuild transient search/selection on resume; never select a child for the adult. */
export const parentResumeIndex = (id: string, saved: number) =>
  id === 'parent-first-link' ? (saved === 2 ? 2 : 0) : id === 'parent-first-progress' ? 0 : saved;
export const parentRegistryForRoute = (registry: GuideRegistryEntry[], path: string) => registry.map(entry =>
  entry.id === 'parent-child-progress' && /^\/parent\/student\/[^/]+$/.test(path)
    ? { ...entry, route: path, steps: entry.steps.map(step => ({ ...step, targetId: 'parent-progress-overview' })) } : entry);
