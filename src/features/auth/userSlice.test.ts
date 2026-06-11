import { describe, expect, it } from 'vitest';

import reducer, { login, logout } from './userSlice';

describe('userSlice auth readiness', () => {
  it('marks auth as ready when logout runs before an initial session succeeds', () => {
    const state = reducer(undefined, logout());

    expect(state.user).toBeNull();
    expect(state.authReady).toBe(true);
  });

  it('keeps auth ready after logging out an authenticated user', () => {
    const loggedInState = reducer(
      undefined,
      login({
        id: 'user-1',
        name: 'Usuario de prueba',
        businessID: 'business-1',
        role: 'admin',
      }),
    );

    const state = reducer(loggedInState, logout());

    expect(state.user).toBeNull();
    expect(state.authReady).toBe(true);
  });
});
