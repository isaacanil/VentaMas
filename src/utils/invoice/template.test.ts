import { describe, expect, it } from 'vitest';

import {
  DEPRECATED_INVOICE_TEMPLATE_KEYS,
  LETTER_INVOICE_TEMPLATE_KEY,
  PAGINATED_DOM_INVOICE_TEMPLATE_KEY,
  getInvoiceTemplateSummaryLabel,
  isDeprecatedInvoiceTemplate,
} from './template';

describe('invoice template metadata', () => {
  it('marks only superseded letter template variants as deprecated', () => {
    expect(DEPRECATED_INVOICE_TEMPLATE_KEYS).toEqual([
      'template2_v2',
      'template2_v3',
      'template2_v3_1',
      'template2_v4',
    ]);

    DEPRECATED_INVOICE_TEMPLATE_KEYS.forEach((templateKey) => {
      expect(isDeprecatedInvoiceTemplate(templateKey)).toBe(true);
    });

    expect(isDeprecatedInvoiceTemplate(LETTER_INVOICE_TEMPLATE_KEY)).toBe(
      false,
    );
    expect(
      isDeprecatedInvoiceTemplate(PAGINATED_DOM_INVOICE_TEMPLATE_KEY),
    ).toBe(false);
  });

  it('labels deprecated variants without renaming active letter templates', () => {
    expect(getInvoiceTemplateSummaryLabel('template2_v3_1')).toBe(
      'Carta V3.1 HTML Beta (Deprecada)',
    );
    expect(getInvoiceTemplateSummaryLabel(LETTER_INVOICE_TEMPLATE_KEY)).toBe(
      'Carta',
    );
    expect(
      getInvoiceTemplateSummaryLabel(PAGINATED_DOM_INVOICE_TEMPLATE_KEY),
    ).toBe('Carta paginada DOM');
  });
});
