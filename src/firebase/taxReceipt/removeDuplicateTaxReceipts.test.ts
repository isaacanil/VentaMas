import { describe, expect, it } from 'vitest';

import type { TaxReceiptDocument } from '@/types/taxReceipt';

import { dedupeTaxReceiptDocuments } from './removeDuplicateTaxReceipts';

const buildReceipt = ({
  id,
  name = id,
  serie,
  sequence = '0000000000',
  createdAt,
}: {
  id: string;
  name?: string;
  serie: string;
  sequence?: string | number;
  createdAt?: number;
}): TaxReceiptDocument => ({
  id,
  data: {
    id,
    name,
    type: 'B',
    serie,
    sequence,
    createdAt,
  },
});

describe('dedupeTaxReceiptDocuments', () => {
  it('keeps one receipt per serie and prefers a consumed sequence', () => {
    const receipts = [
      buildReceipt({
        id: 'default-sequence',
        serie: '01',
        sequence: '0000000000',
        createdAt: 100,
      }),
      buildReceipt({
        id: 'consumed-sequence',
        serie: '01',
        sequence: '0000000012',
        createdAt: 200,
      }),
    ];

    expect(dedupeTaxReceiptDocuments(receipts)).toEqual([receipts[1]]);
  });

  it('treats numeric zero as an unused sequence and keeps the oldest receipt', () => {
    const receipts = [
      buildReceipt({
        id: 'newer',
        serie: '02',
        sequence: 0,
        createdAt: 300,
      }),
      buildReceipt({
        id: 'older',
        serie: '02',
        sequence: '0000000000',
        createdAt: 100,
      }),
    ];

    expect(dedupeTaxReceiptDocuments(receipts)).toEqual([receipts[1]]);
  });

  it('preserves distinct series and the order of selected receipts', () => {
    const receipts = [
      buildReceipt({ id: 'serie-02', serie: '02', createdAt: 100 }),
      buildReceipt({ id: 'serie-01-newer', serie: '01', createdAt: 200 }),
      buildReceipt({ id: 'serie-01-older', serie: '01', createdAt: 50 }),
    ];

    expect(dedupeTaxReceiptDocuments(receipts)).toEqual([
      receipts[0],
      receipts[2],
    ]);
  });
});
