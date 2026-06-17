import { describe, expect, it } from 'vitest';

import { resolveUserDisplayName, resolveUserInitials } from './userDisplay';

describe('userDisplay', () => {
  describe('resolveUserDisplayName', () => {
    it('prefers explicit display fields before username and email', () => {
      expect(
        resolveUserDisplayName({
          displayName: '  Ana Mercado  ',
          realName: 'Ana M.',
          name: 'Ana',
          username: 'amercado',
          email: 'ana@example.com',
        }),
      ).toBe('Ana Mercado');
    });

    it('falls back through username, email, uid and the provided fallback', () => {
      expect(resolveUserDisplayName({ username: ' cajera1 ' })).toBe('cajera1');
      expect(resolveUserDisplayName({ email: ' caja@example.com ' })).toBe(
        'caja@example.com',
      );
      expect(resolveUserDisplayName({ uid: 'user-1' })).toBe('user-1');
      expect(resolveUserDisplayName(null, 'Sin usuario')).toBe('Sin usuario');
    });
  });

  describe('resolveUserInitials', () => {
    it('uses the first two readable words from a display name', () => {
      expect(resolveUserInitials('Ana Mercado')).toBe('AM');
      expect(resolveUserInitials({ displayName: 'Luis' })).toBe('L');
    });

    it('uses the local part of an email for initials', () => {
      expect(resolveUserInitials({ email: 'ana.mercado@example.com' })).toBe(
        'AM',
      );
    });

    it('returns the fallback when no readable value exists', () => {
      expect(resolveUserInitials(null)).toBe('U');
      expect(resolveUserInitials({ displayName: '   ' }, 'X')).toBe('X');
    });
  });
});
