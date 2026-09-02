import React from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import App, { useInternetConnection } from './App';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('renders without crashing', () => {
  const { baseElement } = render(<App />);
  expect(baseElement).toBeDefined();
});

test('keeps the app available for one transient API health failure', async () => {
  vi.useFakeTimers();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const fetchMock = vi.fn().mockRejectedValue(new Error('temporary network failure'));
  vi.stubGlobal('fetch', fetchMock);

  const { result, unmount } = renderHook(() => useInternetConnection());

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result.current).toBe(true);

  await act(async () => {
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current).toBe(false);
  unmount();
});
