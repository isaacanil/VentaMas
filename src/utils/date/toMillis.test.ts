import { describe, expect, it } from 'vitest';

import { serializeTimestampsToMillis, toMillis } from './toMillis';

describe('toMillis', () => {
  it('parses objects with toDate', () => {
    const date = new Date('2026-06-15T10:30:45.123Z');

    expect(toMillis({ toDate: () => date })).toBe(date.getTime());
  });

  it('parses objects with toMillis', () => {
    expect(toMillis({ toMillis: () => 1772492281557 })).toBe(1772492281557);
  });

  it('parses callable timestamp objects with underscored fields', () => {
    expect(
      toMillis({
        _seconds: 1772492281,
        _nanoseconds: 557000000,
      }),
    ).toBe(1772492281557);
  });

  it('parses timestamp objects with public fields', () => {
    expect(
      toMillis({
        seconds: 1772492281,
        nanoseconds: 557000000,
      }),
    ).toBe(1772492281557);
  });
});

describe('serializeTimestampsToMillis', () => {
  it('serializes nested timestamp-like values without parsing primitives', () => {
    const date = new Date('2026-06-15T10:30:45.123Z');
    const serialized = serializeTimestampsToMillis({
      id: '12345',
      amount: 250,
      numericText: '1772492281557',
      createdAt: {
        seconds: 1772492281,
        nanoseconds: 557000000,
      },
      updatedAt: {
        _seconds: 1772492282,
        _nanoseconds: 125000000,
      },
      history: [
        {
          date: { toMillis: () => 1772492283000 },
        },
        {
          date: { toDate: () => date },
        },
      ],
    });

    expect(serialized).toEqual({
      id: '12345',
      amount: 250,
      numericText: '1772492281557',
      createdAt: 1772492281557,
      updatedAt: 1772492282125,
      history: [
        {
          date: 1772492283000,
        },
        {
          date: date.getTime(),
        },
      ],
    });
  });

  it('leaves non-plain objects without timestamp shape untouched', () => {
    class Money {
      constructor(readonly amount: number) {}
    }

    const money = new Money(120);
    const serialized = serializeTimestampsToMillis({
      money,
      createdAt: new Date('2026-06-15T00:00:00.000Z'),
    });

    expect(serialized.money).toBe(money);
    expect(serialized.createdAt).toBe(
      new Date('2026-06-15T00:00:00.000Z').getTime(),
    );
  });

  it('preserves circular references while serializing timestamp fields', () => {
    const node: Record<string, unknown> = {
      createdAt: { seconds: 1772492281, nanoseconds: 0 },
    };
    node.self = node;

    const serialized = serializeTimestampsToMillis(node) as Record<
      string,
      unknown
    >;

    expect(serialized.createdAt).toBe(1772492281000);
    expect(serialized.self).toBe(serialized);
  });
});
