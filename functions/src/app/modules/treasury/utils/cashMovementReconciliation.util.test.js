import { describe, expect, it } from 'vitest';

import {
  isMovementPosted,
  isCashMovementReconciledOrLinked,
  resolveMovementSignedAmount,
} from './cashMovementReconciliation.util.js';

describe('resolveMovementSignedAmount', () => {
  it('returns signed positive movement amounts rounded to two decimals', () => {
    expect(
      resolveMovementSignedAmount({
        amount: '25.235',
        direction: 'in',
      }),
    ).toBe(25.24);
    expect(
      resolveMovementSignedAmount({
        amount: '25.235',
        direction: 'out',
      }),
    ).toBe(-25.24);
  });

  it('ignores non-positive amounts by default', () => {
    expect(
      resolveMovementSignedAmount({
        amount: 0,
        direction: 'in',
      }),
    ).toBe(0);
    expect(
      resolveMovementSignedAmount({
        amount: -10,
        direction: 'out',
      }),
    ).toBe(0);
  });

  it('can preserve transfer balance behavior for non-positive amounts', () => {
    expect(
      resolveMovementSignedAmount(
        {
          amount: -10,
          direction: 'out',
        },
        {
          allowNonPositiveAmount: true,
        },
      ),
    ).toBe(10);
  });
});

describe('isMovementPosted', () => {
  it('rejects draft and void movements', () => {
    expect(isMovementPosted({ status: 'draft' })).toBe(false);
    expect(isMovementPosted({ status: ' VOID ' })).toBe(false);
  });

  it('accepts posted movements and movements without a blocked status', () => {
    expect(isMovementPosted({ status: 'posted' })).toBe(true);
    expect(isMovementPosted({})).toBe(true);
  });
});

describe('isCashMovementReconciledOrLinked', () => {
  it('detects reconciled or statement-linked cash movements', () => {
    expect(
      isCashMovementReconciledOrLinked({
        reconciliationId: ' rec-1 ',
      }),
    ).toBe(true);
    expect(
      isCashMovementReconciledOrLinked({
        bankStatementLineId: 'statement-line-1',
      }),
    ).toBe(true);
    expect(
      isCashMovementReconciledOrLinked({
        reconciliationStatus: 'ReConciled',
      }),
    ).toBe(true);
  });

  it('ignores unreconciled movements without reconciliation links', () => {
    expect(
      isCashMovementReconciledOrLinked({
        reconciliationId: ' ',
        bankStatementLineId: null,
        reconciliationStatus: 'unreconciled',
      }),
    ).toBe(false);
    expect(isCashMovementReconciledOrLinked(null)).toBe(false);
  });
});
