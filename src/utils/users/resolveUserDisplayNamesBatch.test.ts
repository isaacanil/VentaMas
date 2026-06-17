import type { Firestore } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveUserDisplayNamesBatch } from './resolveUserDisplayNamesBatch';

const getDocsMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db: unknown, path: string) => ({ db, path })),
  documentId: vi.fn(() => '__name__'),
  getDocs: getDocsMock,
  query: vi.fn((collectionRef: unknown, clause: unknown) => ({
    collectionRef,
    clause,
  })),
  where: vi.fn((field: unknown, op: unknown, value: unknown) => ({
    field,
    op,
    value,
  })),
}));

const makeSnapshot = (
  docs: Array<{ id: string; data: Record<string, unknown> }>,
) => ({
  forEach: (
    callback: (docSnap: {
      id: string;
      data: () => Record<string, unknown>;
    }) => void,
  ) => {
    docs.forEach((doc) => {
      callback({
        id: doc.id,
        data: () => doc.data,
      });
    });
  },
});

describe('resolveUserDisplayNamesBatch', () => {
  const db = {} as Firestore;

  beforeEach(() => {
    getDocsMock.mockReset();
  });

  it('resolves missing user documents through the shared display-name utility', async () => {
    getDocsMock.mockResolvedValue(
      makeSnapshot([
        {
          id: 'uid-1',
          data: {
            displayName: '  Ana Mercado  ',
            realName: 'Ana M.',
            name: 'Ana',
            email: 'ana@example.com',
          },
        },
        {
          id: 'uid-2',
          data: {
            username: ' cajera1 ',
          },
        },
        {
          id: 'uid-3',
          data: {
            displayName: '   ',
          },
        },
      ]),
    );

    await expect(
      resolveUserDisplayNamesBatch(
        db,
        ['uid-1', 'uid-2', 'uid-3', 'missing-uid', 'cached-uid', null],
        {
          'cached-uid': 'Cached User',
        },
      ),
    ).resolves.toEqual({
      'uid-1': 'Ana Mercado',
      'uid-2': 'cajera1',
      'uid-3': 'uid-3',
      'missing-uid': 'missing-uid',
    });
    expect(getDocsMock).toHaveBeenCalledTimes(1);
  });

  it('skips Firestore when every uid is already cached', async () => {
    await expect(
      resolveUserDisplayNamesBatch(db, ['uid-1'], {
        'uid-1': 'Cached User',
      }),
    ).resolves.toEqual({});

    expect(getDocsMock).not.toHaveBeenCalled();
  });

  it('falls back each requested uid when a batch query fails', async () => {
    getDocsMock.mockRejectedValue(new Error('permission-denied'));

    await expect(
      resolveUserDisplayNamesBatch(db, ['uid-1', 'uid-2']),
    ).resolves.toEqual({
      'uid-1': 'uid-1',
      'uid-2': 'uid-2',
    });
  });
});
