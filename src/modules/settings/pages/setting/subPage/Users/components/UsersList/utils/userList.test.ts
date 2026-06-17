import { describe, expect, it } from 'vitest';

import { resolveBusinessOwnerCandidates, toMillis } from './userList';

describe('userList toMillis', () => {
  it('delegates timestamp-like conversion to the shared date helper', () => {
    expect(toMillis(1000)).toBe(1000);
    expect(toMillis({ toMillis: () => 2000 })).toBe(2000);
    expect(toMillis({ seconds: 3, nanoseconds: 500000000 })).toBe(3500);
    expect(toMillis({ _seconds: 4, _nanoseconds: 250000000 })).toBe(4250);
    expect(toMillis(null)).toBeNull();
    expect(toMillis(undefined)).toBeNull();
  });
});

describe('resolveBusinessOwnerCandidates', () => {
  it('ignores array business snapshots', () => {
    expect(resolveBusinessOwnerCandidates([])).toEqual([]);
  });

  it('dedupes owner candidates from root and nested business nodes', () => {
    expect(
      resolveBusinessOwnerCandidates({
        ownerUid: ' owner-1 ',
        owners: ['owner-2', ' ', null],
        business: {
          ownerUid: 'owner-1',
          owners: ['owner-3'],
          business: {
            ownerUid: 'owner-4',
            owners: ['owner-2'],
          },
        },
      }),
    ).toEqual(['owner-1', 'owner-4', 'owner-2', 'owner-3']);
  });
});
