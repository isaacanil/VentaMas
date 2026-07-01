import { describe, expect, it } from 'vitest';

import { resolveAccountsPayableSummaryStripLoading } from './useAccountsPayableViewState';

describe('resolveAccountsPayableSummaryStripLoading', () => {
  it('keeps visible fallback metrics when aggregate summary failed but rows exist', () => {
    expect(
      resolveAccountsPayableSummaryStripLoading({
        aggregateSummaryErrorMessage:
          'Falta un indice de Firestore para calcular los agregados de CxP.',
        isLoading: true,
        visibleFallbackRowCount: 3,
      }),
    ).toBe(false);
  });

  it('keeps the summary loading state when there are no visible fallback rows', () => {
    expect(
      resolveAccountsPayableSummaryStripLoading({
        aggregateSummaryErrorMessage:
          'Falta un indice de Firestore para calcular los agregados de CxP.',
        isLoading: true,
        visibleFallbackRowCount: 0,
      }),
    ).toBe(true);
  });
});
