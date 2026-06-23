import { describe, expect, it } from 'vitest';

import type { PaginationRuntimeState } from '@/components/DocumentPagination';

import { formatPaginatedPrintFallbackReason } from './paginatedPrintFallbackReason';

const runtimeState: PaginationRuntimeState = {
  chromeOverflowRoles: ['single'],
  duplicateBlockIds: ['summary-final'],
  measured: true,
  overflowBlockIds: ['product-line-1'],
  pageCount: 2,
  readyToPrint: false,
  stable: true,
  unmeasuredBlockIds: ['notes'],
};

describe('paginatedPrintFallbackReason', () => {
  it('formats the blocking runtime state with actionable identifiers', () => {
    expect(
      formatPaginatedPrintFallbackReason({
        code: 'paginated-print-layout-blocked',
        state: runtimeState,
      }),
    ).toBe(
      'paginated-print-layout-blocked: measured=yes; stable=yes; ready=no; pages=2; overflowBlocks=product-line-1; chromeOverflowRoles=single; duplicateBlocks=summary-final; unmeasuredBlocks=notes',
    );
  });

  it('keeps simple fallback codes when no runtime state exists', () => {
    expect(
      formatPaginatedPrintFallbackReason({
        code: 'paginated-print-timeout',
      }),
    ).toBe('paginated-print-timeout');
  });
});
