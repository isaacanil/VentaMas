import { describe, expect, it } from 'vitest';

import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('uses the message from Error instances', () => {
    expect(getErrorMessage(new Error('Mensaje real'), 'Fallback')).toBe(
      'Mensaje real',
    );
  });

  it('uses string errors as-is', () => {
    expect(getErrorMessage('Error plano', 'Fallback')).toBe('Error plano');
  });

  it('uses the provided fallback for unknown error values', () => {
    expect(getErrorMessage(null, 'Fallback especifico')).toBe(
      'Fallback especifico',
    );
  });
});
