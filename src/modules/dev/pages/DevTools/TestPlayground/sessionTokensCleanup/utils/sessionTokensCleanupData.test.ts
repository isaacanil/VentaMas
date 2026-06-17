import { describe, expect, it } from 'vitest';

import {
  hasOnlyUserId,
  toIncompleteSessionTokenResult,
} from './sessionTokensCleanupData';

describe('sessionTokensCleanupData', () => {
  it('identifies documents that only contain userId', () => {
    expect(hasOnlyUserId({ userId: 'user-1' })).toBe(true);
    expect(hasOnlyUserId({ userId: 'user-1', token: 'active' })).toBe(false);
    expect(hasOnlyUserId({ userId: undefined })).toBe(false);
  });

  it('maps incomplete token documents to display items', () => {
    expect(
      toIncompleteSessionTokenResult('token-1', { userId: 'user-1' }),
    ).toEqual({
      id: 'token-1',
      userId: 'user-1',
      keys: ['userId'],
    });
  });

  it('returns null for complete token documents', () => {
    expect(
      toIncompleteSessionTokenResult('token-2', {
        userId: 'user-1',
        tokenHash: 'hash',
      }),
    ).toBeNull();
  });
});
