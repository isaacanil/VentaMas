import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearStoredSession,
  getStoredSession,
  storeSessionLocally,
} from './sessionClient';

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
  window,
  'localStorage',
);

const restoreLocalStorage = (): void => {
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
  }
};

describe('sessionClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    restoreLocalStorage();
    window.localStorage.clear();
  });

  it('returns an empty session when localStorage is blocked', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    });

    expect(() => storeSessionLocally({ sessionToken: 'token-1' })).not.toThrow();
    expect(() => clearStoredSession()).not.toThrow();
    expect(getStoredSession()).toEqual({
      deviceId: null,
      sessionExpiresAt: null,
      sessionId: null,
      sessionToken: null,
    });
  });

  it('does not throw when localStorage methods fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(() =>
      storeSessionLocally({
        sessionExpiresAt: 123,
        sessionId: 'session-1',
        sessionToken: 'token-1',
      }),
    ).not.toThrow();
    expect(() => clearStoredSession()).not.toThrow();
    expect(getStoredSession()).toEqual({
      deviceId: null,
      sessionExpiresAt: null,
      sessionId: null,
      sessionToken: null,
    });
  });
});
