import { describe, expect, it } from 'vitest';

import { normalizeFirestoreUser } from './normalizeFirestoreUser';

describe('normalizeFirestoreUser', () => {
  it('falls back to the document id when the payload is not a record', () => {
    expect(normalizeFirestoreUser('user-1', [])).toEqual({
      id: 'user-1',
      uid: 'user-1',
    });
  });

  it('normalizes business aliases from root and nested business records', () => {
    expect(
      normalizeFirestoreUser('user-2', {
        uid: 'user-2',
        business: {
          id: ' business-nested ',
        },
      }),
    ).toMatchObject({
      id: 'user-2',
      uid: 'user-2',
      activeBusinessId: 'business-nested',
      businessID: 'business-nested',
      businessId: 'business-nested',
    });
  });

  it('ignores array business nodes and preserves clean root aliases', () => {
    expect(
      normalizeFirestoreUser('user-3', {
        uid: ' user-3 ',
        name: ' Ana ',
        activeBusinessId: ' business-root ',
        business: [],
      }),
    ).toMatchObject({
      id: 'user-3',
      uid: 'user-3',
      name: 'Ana',
      username: 'Ana',
      activeBusinessId: 'business-root',
      businessID: 'business-root',
      businessId: 'business-root',
    });
  });
});
