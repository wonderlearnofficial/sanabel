// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { vi } from 'vitest';

// lottie-web requires a real canvas implementation, which jsdom deliberately
// does not provide. Component tests only need a stable render boundary; the
// animation engine itself is exercised by browsers/native WebViews.
vi.mock('lottie-react', () => ({
  default: () => React.createElement('div', { 'data-testid': 'lottie-animation' }),
  useLottie: () => ({
    View: React.createElement('div', { 'data-testid': 'lottie-animation' }),
    play: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
  }),
}));

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};
