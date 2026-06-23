import { describe, expect, it } from 'vitest';

import {
  PAGINATED_INVOICE_PRINT_FEATURE,
  isPaginatedInvoicePrintEnabled,
  resolveInvoicePrintStrategy,
} from './resolveInvoicePrintStrategy';

describe('resolveInvoicePrintStrategy', () => {
  it('keeps the legacy HTML print path when the paginated engine flag is off', () => {
    expect(
      resolveInvoicePrintStrategy({
        business: {
          features: {
            fiscal: { [PAGINATED_INVOICE_PRINT_FEATURE]: false },
          },
        },
        invoiceType: 'template1',
      }),
    ).toBe('legacy-react-print');
  });

  it('uses the paginated DOM engine for eligible non-PDF templates when enabled at business level', () => {
    expect(
      resolveInvoicePrintStrategy({
        business: {
          features: {
            fiscal: { [PAGINATED_INVOICE_PRINT_FEATURE]: true },
          },
        },
        invoiceType: 'template1',
      }),
    ).toBe('paginated-dom');
  });

  it('uses the paginated DOM engine when the nested business fiscal feature is enabled', () => {
    expect(
      isPaginatedInvoicePrintEnabled({
        business: {
          features: {
            fiscal: { [PAGINATED_INVOICE_PRINT_FEATURE]: true },
          },
        },
      }),
    ).toBe(true);
  });

  it('keeps programmatic PDF templates on their existing path even when the flag is enabled', () => {
    expect(
      resolveInvoicePrintStrategy({
        business: {
          features: {
            fiscal: { [PAGINATED_INVOICE_PRINT_FEATURE]: true },
          },
        },
        invoiceType: 'template2',
      }),
    ).toBe('programmatic-pdf');
  });
});
