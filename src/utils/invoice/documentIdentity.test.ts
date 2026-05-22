import { describe, expect, it } from 'vitest';

import {
  isPreorderDocument,
  resolveDocumentIdentity,
} from '@/utils/invoice/documentIdentity';

describe('isPreorderDocument', () => {
  it('treats corrupted boolean status as preorder when invoice is marked as preorder and has no NCF', () => {
    expect(
      isPreorderDocument({
        type: 'preorder',
        // legacy corrupted status
        status: true as any,
        preorderDetails: { isOrWasPreorder: true, numberID: 123 },
        NCF: '',
      }),
    ).toBe(true);
  });

  it('does not treat completed docs as preorder', () => {
    expect(
      isPreorderDocument({
        type: 'preorder',
        status: 'completed',
        preorderDetails: { isOrWasPreorder: true, numberID: 123 },
        NCF: '',
      }),
    ).toBe(false);
  });

  it('resolves electronic fiscal document identity from e-NCF', () => {
    expect(
      resolveDocumentIdentity({
        electronicTaxReceipt: {
          eNcf: 'E320000000001',
          documentType: 'E32',
        },
      }),
    ).toMatchObject({
      title: 'FACTURA DE CONSUMO ELECTRÓNICA',
      label: 'e-NCF',
      value: 'E320000000001',
      type: 'fiscal-consumer',
    });
  });

  it('does not fall back to payment receipt when e-CF is pending without e-NCF', () => {
    expect(
      resolveDocumentIdentity({
        documentFormat: 'electronic',
        electronicTaxReceipt: {
          status: 'shadow_ready',
          documentType: 'E31',
        },
      }),
    ).toMatchObject({
      title: 'FACTURA DE CRÉDITO FISCAL ELECTRÓNICA',
      label: 'e-NCF',
      value: null,
      type: 'fiscal-credit',
    });
  });
});
