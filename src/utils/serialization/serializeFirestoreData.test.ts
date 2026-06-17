import { describe, expect, it } from 'vitest';

import {
  serializeFirestoreData,
  serializeFirestoreDocuments,
} from './serializeFirestoreData';

describe('serializeFirestoreData', () => {
  it('serializes nested timestamp-like values to milliseconds', () => {
    const serialized = serializeFirestoreData({
      id: 'receipt-1',
      numericText: '1772492281557',
      createdAt: {
        seconds: 1772492281,
        nanoseconds: 557000000,
      },
      audit: {
        updatedAt: { toMillis: () => 1772492282125 },
        history: [
          {
            reviewedAt: {
              seconds: '1772492283',
              nanoseconds: '250000000',
            },
          },
        ],
      },
    });

    expect(serialized).toEqual({
      id: 'receipt-1',
      numericText: '1772492281557',
      createdAt: 1772492281557,
      audit: {
        updatedAt: 1772492282125,
        history: [
          {
            reviewedAt: 1772492283250,
          },
        ],
      },
    });
  });

  it('serializes arrays of Firestore documents and preserves empty inputs', () => {
    expect(
      serializeFirestoreDocuments([
        {
          id: 'doc-1',
          createdAt: { toMillis: () => 1772492281000 },
        },
        {
          id: 'doc-2',
          createdAt: { seconds: 1772492282, nanoseconds: 125000000 },
        },
      ]),
    ).toEqual([
      {
        id: 'doc-1',
        createdAt: 1772492281000,
      },
      {
        id: 'doc-2',
        createdAt: 1772492282125,
      },
    ]);

    expect(serializeFirestoreDocuments(null)).toBeNull();
    expect(serializeFirestoreDocuments(undefined)).toBeUndefined();
  });
});
