import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { Firestore } from 'firebase/firestore';

const resolveUserDisplayNamesBatchMock = vi.hoisted(() => vi.fn());

vi.mock('@/firebase/firebaseconfig', () => ({
  db: {},
}));

vi.mock('@/utils/users/resolveUserDisplayNamesBatch', async () => {
  const actual = await vi.importActual<
    typeof import('@/utils/users/resolveUserDisplayNamesBatch')
  >('@/utils/users/resolveUserDisplayNamesBatch');

  return {
    ...actual,
    resolveUserDisplayNamesBatch: (...args: unknown[]) =>
      resolveUserDisplayNamesBatchMock(...args),
  };
});

import { useUserNamesCache } from './useUserNamesCache';

const db = {} as Firestore;

describe('useUserNamesCache', () => {
  beforeEach(() => {
    resolveUserDisplayNamesBatchMock.mockReset();
  });

  it('derives updatedByName seeds during render', () => {
    const { result } = renderHook(() =>
      useUserNamesCache({
        db,
        countsMeta: {
          row1: {
            updatedBy: 'user-1',
            updatedByName: 'Ana Perez',
          },
        },
        session: null,
      }),
    );

    expect(result.current.usersNameCache).toEqual({
      'user-1': 'Ana Perez',
    });
    expect(resolveUserDisplayNamesBatchMock).not.toHaveBeenCalled();
  });

  it('resolves only names missing from the seeded cache', async () => {
    resolveUserDisplayNamesBatchMock.mockResolvedValue({
      'user-2': 'Luis Gomez',
    });
    const countsMeta = {
      row1: {
        updatedBy: 'user-1',
        updatedByName: 'Ana Perez',
      },
    };
    const session = {
      createdBy: 'user-2',
    };

    const { result } = renderHook(() =>
      useUserNamesCache({
        db,
        countsMeta,
        session,
      }),
    );

    await waitFor(() =>
      expect(result.current.usersNameCache).toEqual({
        'user-1': 'Ana Perez',
        'user-2': 'Luis Gomez',
      }),
    );
    expect(resolveUserDisplayNamesBatchMock).toHaveBeenCalledWith(
      db,
      ['user-2'],
      {
        'user-1': 'Ana Perez',
      },
    );
  });
});
