import { describe, expect, it } from 'vitest';

import {
  assertValidProviderLoginPayload,
  buildGoogleProviderLoginSuccess,
  type ValidProviderLoginPayload,
} from './providerLogin';

const user = {
  id: 'user-1',
} as ValidProviderLoginPayload['user'];

describe('providerLogin', () => {
  it('throws backend message when provider login payload is invalid', () => {
    expect(() =>
      assertValidProviderLoginPayload({
        ok: false,
        message: 'Cuenta no disponible.',
      }),
    ).toThrow('Cuenta no disponible.');
  });

  it('requires firebaseCustomToken for a valid payload', () => {
    expect(() =>
      assertValidProviderLoginPayload({
        ok: true,
        sessionToken: 'session-1',
        user,
      }),
    ).toThrow('No se recibio firebaseCustomToken.');
  });

  it('builds a success result from a valid payload', () => {
    const payload = {
      businessHasOwners: true,
      firebaseCustomToken: 'custom-token',
      ok: true,
      sessionToken: 'session-1',
      user,
    } satisfies ValidProviderLoginPayload;

    expect(buildGoogleProviderLoginSuccess(payload)).toEqual({
      businessHasOwners: true,
      status: 'success',
      user,
    });
  });
});
