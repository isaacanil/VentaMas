import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';


if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => false,
    }),
  });
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (element, _pseudo) =>
  originalGetComputedStyle(element);

class ResizeObserver {
  observe() {
    /* no-op */
  }
  unobserve() {
    /* no-op */
  }
  disconnect() {
    /* no-op */
  }
}

globalThis.ResizeObserver = ResizeObserver;
