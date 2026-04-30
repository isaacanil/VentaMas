import { afterEach, describe, expect, it, vi } from 'vitest';

import { shouldUseFirebaseEmulators } from './emulatorConfig';

describe('shouldUseFirebaseEmulators', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not enable emulators just because the app runs on localhost', () => {
    vi.stubEnv('VITE_USE_EMULATORS', undefined);

    expect(shouldUseFirebaseEmulators()).toBe(false);
  });

  it('enables emulators only with explicit opt-in', () => {
    vi.stubEnv('VITE_USE_EMULATORS', '1');

    expect(shouldUseFirebaseEmulators()).toBe(true);
  });

  it('keeps emulators disabled with explicit opt-out', () => {
    vi.stubEnv('VITE_USE_EMULATORS', '0');

    expect(shouldUseFirebaseEmulators()).toBe(false);
  });
});
