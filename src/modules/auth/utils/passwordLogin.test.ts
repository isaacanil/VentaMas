import { describe, expect, it } from 'vitest';

import { assertIsValidSignInResult } from './passwordLogin';

describe('passwordLogin', () => {
  it('accepts sign-in results with a user id', () => {
    expect(() =>
      assertIsValidSignInResult({
        user: {
          id: 'user-1',
        },
      }),
    ).not.toThrow();
  });

  it('rejects sign-in results without a user id', () => {
    expect(() =>
      assertIsValidSignInResult({
        user: {
          name: 'demo',
        },
      }),
    ).toThrow('Respuesta invalida del servicio de autenticacion.');
  });
});
